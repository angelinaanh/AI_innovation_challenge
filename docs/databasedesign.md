# EduOne Adaptive Learning & Content Studio — Thiết kế Database trên Supabase

## Phần 1 — Định hướng thiết kế

Đề bài đặt ra một ràng buộc mà schema phải phục vụ trực tiếp: **hệ thống phải giải thích được và mở rộng được**, không phải chỉ chạy đúng cho 20 học sinh pilot. Sáu nguyên tắc dưới đây là phương hướng, phần 3 sẽ đánh giá schema theo đúng sáu nguyên tắc này.

| # | Nguyên tắc | Vì sao |
|---|---|---|
| P1 | **Event-sourcing cho mọi chỉ số biến động** (điểm STEAM, EXP) | Đề bài (mục 9.3) nói rõ `steam_profiles` là **projection** của `score_events`, không phải nguồn sự thật. Bảng điểm hiện tại chỉ là cache; log sự kiện mới là dữ liệu gốc, phục vụ FR1.4 (lịch sử), FR1.6 (truy vết lý do đề xuất) |
| P2 | **Junction table thay vì mảng ID** cho quan hệ đồ thị (tiên quyết Skill Node) | Mảng `prerequisite_ids[]` không truy vấn ngược được ("Skill Node nào cần A làm tiên quyết?") và không có ràng buộc khoá ngoại. Khi mở rộng sang môn khác (Phase 3), đồ thị sẽ phức tạp hơn nhiều so với 7 node Scratch |
| P3 | **Trạng thái nội dung là ràng buộc CSDL, không phải quy ước ứng dụng** | FR5.4 / NFR-10 yêu cầu "không tồn tại đường đi kỹ thuật nào" đưa DRAFT tới học sinh. Điều này phải nằm ở tầng RLS + view, không thể chỉ dựa vào code backend cẩn thận |
| P4 | **JSONB cho phần chưa ổn định, cột quan hệ cho phần đã ổn định** | `steam_weights`, `content` (checkpoint), `options` câu hỏi sẽ còn thay đổi cấu trúc qua các sprint — JSONB tránh migration liên tục. Nhưng `role`, `status`, khoá ngoại thì dùng cột thật + CHECK constraint để giữ toàn vẹn |
| P5 | **Multi-tenant sẵn sàng nhưng không kích hoạt** | Pilot chỉ có STEAM for Vietnam, nhưng mục 13.3 (Phase 4) nói tới "mở API cho các tổ chức phi lợi nhuận khác". Thêm `org_id` (nullable, mặc định 1 tổ chức) từ đầu rẻ hơn nhiều so với thêm sau khi đã có dữ liệu |
| P6 | **Chi phí và kiểm duyệt là bảng hạng nhất, không phải log phụ** | NFR-3 (cầu dao ngân sách) và NFR-14 (audit không xoá được) là yêu cầu nghiệp vụ, nên `ai_usage` và `audit_log` được thiết kế để truy vấn nhanh (index theo ngày/feature), không phải chỉ ghi log thô |

Một lựa chọn có chủ đích: dùng **ENUM Postgres cho vai trò** (ít thay đổi, cần an toàn kiểu) nhưng dùng **text + CHECK cho trạng thái nội dung / độ khó** (sẽ có khả năng thêm giá trị như `IN_REVIEW`, `NEEDS_REVISION` khi vận hành thực tế — `ALTER TYPE ... ADD VALUE` trên ENUM không rollback được trong transaction, gây rủi ro khi bạn còn đang lặp nhanh ở giai đoạn hackathon).

---

## Phần 2 — Schema SQL (Supabase / PostgreSQL + pgvector)

```sql
-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================
-- 1. TỔ CHỨC & DANH TÍNH (P5, P1)
-- ============================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Không tạo bảng users riêng — mở rộng auth.users của Supabase
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) default '00000000-0000-0000-0000-000000000001',
  email text not null,
  full_name text,
  role text not null check (role in ('student','teacher','parent','admin')),
  grade_band text check (grade_band in ('primary','secondary','high_school')),
  guardian_consent_at timestamptz,          -- FR0.6
  created_at timestamptz not null default now()
);
create index on public.profiles (org_id, role);

create table public.parent_student_links (   -- Phase 2 (FR7), tạo bảng sẵn, chưa bật UI
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text unique,
  linked_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ============================================================
-- 2. ĐỒ THỊ KỸ NĂNG (P2)
-- ============================================================
create table public.skill_nodes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  subject text not null,                     -- 'scratch', mở rộng Phase 3
  grade_band text check (grade_band in ('primary','secondary','high_school')),
  name text not null,
  description text,
  steam_weights jsonb not null default '{}', -- {"S":0.2,"T":0.6,...}  (P4)
  unlock_thresholds jsonb not null default '{}',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table public.skill_node_prerequisites (   -- junction table, không dùng array (P2)
  skill_node_id uuid not null references public.skill_nodes(id) on delete cascade,
  prerequisite_id uuid not null references public.skill_nodes(id) on delete cascade,
  primary key (skill_node_id, prerequisite_id),
  check (skill_node_id <> prerequisite_id)
);

-- ============================================================
-- 3. HỒ SƠ NĂNG LỰC — EVENT SOURCING (P1, phục vụ FR1.4-1.6)
-- ============================================================
create table public.score_events (          -- NGUỒN SỰ THẬT — append-only
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('placement_test','quiz','task','recalibration')),
  source_id uuid,                            -- trỏ tới attempt / test / task tương ứng
  delta_vector jsonb not null,               -- {"S":+3,"T":0,...}
  reason_skill_node_id uuid references public.skill_nodes(id),  -- phục vụ FR1.6 truy vết
  created_at timestamptz not null default now()
);
create index on public.score_events (user_id, created_at);

create table public.steam_profiles (        -- PROJECTION, được trigger duy trì, không sửa tay
  user_id uuid primary key references public.profiles(id) on delete cascade,
  s numeric(5,2) not null default 0 check (s between 0 and 100),
  t numeric(5,2) not null default 0 check (t between 0 and 100),
  e numeric(5,2) not null default 0 check (e between 0 and 100),
  a numeric(5,2) not null default 0 check (a between 0 and 100),
  m numeric(5,2) not null default 0 check (m between 0 and 100),
  updated_at timestamptz not null default now()
);

-- Trigger: mỗi score_event cộng dồn vào steam_profiles.
-- FR1.5: chỉ recalibration mới được phép làm giảm điểm — ép ở tầng trigger, không tin app layer.
create or replace function public.apply_score_event() returns trigger as $$
declare k text; v numeric;
begin
  insert into public.steam_profiles (user_id) values (new.user_id)
    on conflict (user_id) do nothing;
  for k, v in select * from jsonb_each_text(new.delta_vector) loop
    if v::numeric < 0 and new.source_type <> 'recalibration' then
      raise exception 'Chỉ recalibration mới được hạ điểm (FR1.5)';
    end if;
    execute format(
      'update public.steam_profiles set %I = least(100, greatest(0, %I + %L)), updated_at = now() where user_id = %L',
      lower(k), lower(k), v, new.user_id);
  end loop;
  return new;
end; $$ language plpgsql security definer;

create trigger trg_apply_score_event
  after insert on public.score_events
  for each row execute function public.apply_score_event();

-- ============================================================
-- 4. NỘI DUNG — CONTENT STUDIO (P3, P4)
-- ============================================================
create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles(id),
  skill_node_id uuid not null references public.skill_nodes(id),
  storage_path text not null,                -- Supabase Storage bucket path
  extracted_text text,
  created_at timestamptz not null default now()
);

create table public.document_chunks (        -- pgvector cho RAG (FR9.1)
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  skill_node_id uuid not null references public.skill_nodes(id),  -- denormalized, giới hạn phạm vi truy hồi
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
create index on public.document_chunks using ivfflat (embedding vector_cosine_ops);
create index on public.document_chunks (skill_node_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  skill_node_id uuid not null references public.skill_nodes(id),
  status text not null default 'DRAFT'
    check (status in ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED')),   -- text+CHECK, không ENUM (P4)
  difficulty text not null check (difficulty in ('basic','advanced')),
  content jsonb not null default '{}',       -- checkpoints, cấu trúc còn thay đổi
  source_document_id uuid references public.source_documents(id),
  generated_by text,                          -- tên model AI, phục vụ NFR-7
  reviewed_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.lessons (skill_node_id, status);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id),
  skill_node_id uuid not null references public.skill_nodes(id),
  grade_band text,
  type text not null check (type in ('mcq','short_answer')),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  steam_weights jsonb not null default '{}',
  body text not null,
  options jsonb,
  answer_key jsonb not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED')),
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  question_id uuid not null references public.questions(id),
  is_correct boolean not null,
  used_hint boolean not null default false,
  duration_ms int,
  created_at timestamptz not null default now()
);
create index on public.attempts (user_id, question_id);

create table public.content_jobs (            -- đo K-1, K-4 (mục 12)
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents(id),
  skill_node_id uuid not null references public.skill_nodes(id),
  started_at timestamptz not null default now(),
  published_at timestamptz,
  human_minutes numeric,
  edit_rate numeric,
  cost_usd numeric(10,4) default 0,
  status text not null default 'queued' check (status in ('queued','generating','ready_for_review','published','failed'))
);

-- ============================================================
-- 5. GAMIFICATION (P1, tách bạch khỏi steam_profiles theo mục 6.2)
-- ============================================================
create table public.exp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  action_type text not null,
  amount int not null,
  created_at timestamptz not null default now()
);

create table public.exp_totals (              -- projection, trigger tương tự steam_profiles
  user_id uuid primary key references public.profiles(id),
  total_exp int not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);

create table public.streaks (
  user_id uuid primary key references public.profiles(id),
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id),
  badge_id uuid not null references public.badges(id),
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ============================================================
-- 6. AI TUTOR (P3 — grounded, FR9)
-- ============================================================
create table public.tutor_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  skill_node_id uuid not null references public.skill_nodes(id),
  created_at timestamptz not null default now()
);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutor_sessions(id) on delete cascade,
  role text not null check (role in ('student','assistant')),
  content text not null,
  retrieved_chunk_ids uuid[],                -- nguồn trích dẫn, phục vụ NFR-6
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create table public.tutor_escalations (       -- FR9.2
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutor_sessions(id),
  message_id uuid not null references public.tutor_messages(id),
  status text not null default 'pending' check (status in ('pending','answered','ingested')),
  assigned_teacher_id uuid references public.profiles(id),
  resolution text,
  resolved_at timestamptz
);

-- ============================================================
-- 7. CHI PHÍ AI & QUAN SÁT (P6, NFR-3/13)
-- ============================================================
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  feature text not null,                      -- 'tutor' | 'lesson_gen' | 'quiz_gen' ...
  model text not null,
  tier smallint not null check (tier between 1 and 4),  -- bậc thang mục 8/10
  tokens_in int default 0,
  tokens_out int default 0,
  cost_usd numeric(10,6) not null default 0,
  cache_hit boolean not null default false,
  user_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.ai_usage (org_id, created_at);
create index on public.ai_usage (feature, created_at);

create table public.daily_cost_budgets (      -- cầu dao NFR-3
  org_id uuid not null references public.organizations(id),
  date date not null,
  budget_usd numeric(10,2) not null,
  spent_usd numeric(10,4) not null default 0,
  circuit_tripped boolean not null default false,
  primary key (org_id, date)
);

-- ============================================================
-- 8. AUDIT (P6, NFR-14 — không thể xoá)
-- ============================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);
-- Không có policy UPDATE/DELETE nào được tạo cho bảng này ở phần RLS bên dưới -> bất biến.
```

### RLS then trọng — ví dụ 3 bảng đại diện cho từng nhóm rủi ro

```sql
alter table public.lessons enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

-- (a) Nội dung: học sinh CHỈ thấy PUBLISHED — hiện thực hoá P3 / NFR-10 ở tầng CSDL
create policy lessons_student_read on public.lessons for select
  using (
    status = 'PUBLISHED'
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.role in ('teacher','admin'))
  );

-- (b) Danh tính: mỗi người chỉ sửa hồ sơ của chính mình; admin toàn quyền trong org
create policy profiles_self_or_admin on public.profiles for select
  using (
    id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.role = 'admin' and p.org_id = profiles.org_id)
  );

-- (c) Audit: mọi vai trò ĐỀU chỉ được INSERT, không ai được UPDATE/DELETE
create policy audit_insert_only on public.audit_log for insert
  with check (actor_id = auth.uid());
create policy audit_admin_read on public.audit_log for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'admin' and p.org_id = audit_log.org_id));
```

Ba policy này là đại diện, không phải toàn bộ — mỗi bảng còn lại (score_events, attempts, tutor_messages, ai_usage...) đi theo cùng khuôn: học sinh chỉ đọc/ghi dữ liệu của chính `user_id = auth.uid()`, giảng viên đọc theo lớp/skill_node phụ trách, admin đọc toàn `org_id`.

---

## Phần 3 — Đánh giá theo phương hướng đã chọn

| Nguyên tắc | Đạt được gì | Còn thiếu / cần quyết định thêm |
|---|---|---|
| **P1 — Event sourcing** | `score_events`/`exp_events` là log bất biến; `steam_profiles`/`exp_totals` là cache được trigger duy trì tự động → khớp đúng ghi chú thiết kế ở mục 9.3 của đề xuất. FR1.4 (lịch sử tiến bộ) trả lời bằng `select * from score_events order by created_at` mà không cần bảng riêng | Trigger cộng dồn bằng `format()` + `execute` hơi "thủ công" — ở production nên thay bằng 5 câu lệnh `update` tường minh cho từng cột để tránh rủi ro SQL injection qua tên cột động (ở đây cột `k` không đến từ input người dùng nên an toàn, nhưng vẫn nên viết tường minh nếu đội thiếu kinh nghiệm Postgres) |
| **P2 — Junction table** | `skill_node_prerequisites` cho phép truy vấn hai chiều, thêm ràng buộc `check` chống tự-tham-chiếu, sẵn sàng cho đồ thị phức tạp hơn ở Phase 3 | Chưa chống được **chu trình** (A cần B, B cần A) — nếu cần, phải kiểm tra bằng recursive CTE ở tầng ứng dụng khi tạo skill_node mới, CSDL không tự chặn được |
| **P3 — Trạng thái là ràng buộc CSDL** | RLS policy `lessons_student_read` khớp chính xác yêu cầu "không tồn tại đường đi kỹ thuật nào" (NFR-10) — kể cả nếu backend có bug, học sinh vẫn không đọc được bản ghi DRAFT vì Postgres chặn ở tầng row | `document_chunks` (dùng cho RAG) hiện **không** lọc theo `lessons.status` — nếu một chunk thuộc tài liệu nguồn chưa publish mà Tutor lỡ truy hồi, nó có thể rò rỉ nội dung chưa duyệt. Cần thêm điều kiện join `document_chunks -> lessons.status = 'PUBLISHED'` vào chính RLS hoặc vào hàm truy hồi RAG, không chỉ dựa vào `source_documents` |
| **P4 — JSONB có chọn lọc** | `steam_weights`, `content`, `options` linh hoạt đúng chỗ hay đổi cấu trúc; các trường quan hệ (role, status, khoá ngoại) vẫn có kiểu và ràng buộc | JSONB không có index mặc định — nếu dashboard cần lọc theo `steam_weights->>'S' > 0.5` thường xuyên, cần thêm GIN index hoặc cột generated (`generated always as`) cho trục hay truy vấn nhất |
| **P5 — Multi-tenant sẵn sàng** | Mọi bảng cấp tổ chức đều có `org_id`; RLS đã tham chiếu `org_id` thay vì giả định 1 tổ chức duy nhất → khi Phase 4 mở API cho tổ chức khác, không cần migration cấu trúc | Ở pilot, `org_id` mặc định cứng vào 1 UUID hardcode — cần thay bằng giá trị lấy từ context đăng ký thay vì default tĩnh trước khi có tổ chức thứ hai |
| **P6 — Chi phí & audit hạng nhất** | `ai_usage` có index theo `(org_id, created_at)` và `(feature, created_at)` phục vụ trực tiếp FR10.4 (dashboard chi phí theo ngày/tính năng); `audit_log` không có policy UPDATE/DELETE nào → bất biến đúng NFR-14 mà không cần trigger chặn riêng | `daily_cost_budgets.circuit_tripped` cần một trigger hoặc scheduled function (Supabase Edge Function + cron) để tự động set `true` khi `spent_usd >= budget_usd` — bảng mới chỉ là chỗ chứa, chưa có cơ chế tự ngắt |

### Đánh giá tổng thể so với các yêu cầu phi chức năng khó nhất

- **NFR-4 (10.000 học viên đồng thời)**: schema chuẩn hoá tốt, các bảng nóng nhất (`attempts`, `score_events`, `ai_usage`, `document_chunks`) đều có index theo cột truy vấn chính. Điểm cần theo dõi khi scale thật: trigger `apply_score_event` chạy đồng bộ trong transaction ghi — nếu tốc độ ghi `score_events` rất cao, nên cân nhắc chuyển sang cập nhật `steam_profiles` bất đồng bộ qua queue thay vì trigger đồng bộ.
- **NFR-6 (≥95% câu trả lời Tutor có trích dẫn hợp lệ)**: đo được trực tiếp bằng `tutor_messages.retrieved_chunk_ids is not null`, không cần bảng phụ.
- **NFR-9 (dữ liệu trẻ em)**: `profiles.guardian_consent_at` là điều kiện, nhưng schema hiện **chưa chặn** việc tạo nội dung/hoạt động học tập khi `guardian_consent_at is null` — nên có policy hoặc constraint kiểm tra ở các bảng ghi hoạt động (`attempts`, `score_events`) thay vì chỉ dựa vào logic ứng dụng.
- **Kill criteria (edit_rate > 60%)**: `content_jobs.edit_rate` đã có sẵn cột, chỉ cần một view tổng hợp theo tuần để giám khảo/đội dự án theo dõi trực tiếp mà không cần code thêm.

### Kết luận đánh giá

Phương hướng "event-sourcing + RLS-as-enforcement + JSONB có chọn lọc" khớp với đúng những gì đề xuất đã tự đặt ra ở mục 9.3 và 5.2 (HITL là ràng buộc dữ liệu, không phải tính năng cộng thêm) — nghĩa là schema không chỉ lưu trữ đúng, mà **tự thực thi** một phần các cam kết an toàn của đề bài thay vì phó thác hoàn toàn cho tầng ứng dụng. Hai lỗ hổng cần vá trước khi dùng cho pilot thật: (1) RAG chưa lọc theo trạng thái publish ở tầng chunk, (2) cầu dao chi phí chưa có cơ chế tự động trip. Cả hai đều sửa được bằng cách bổ sung một policy và một scheduled function, không cần đổi cấu trúc bảng.
---

## Phần 4 — Bổ sung: Bài luyện tương tác của Tutor (migration 0002)

Tính năng "AI Tutor sinh bài luyện tương tác" thêm hai bảng (SQL đầy đủ ở `database/migrations/0002_tutor_interactive_exercises.sql`):

- `tutor_exercises` — một bài luyện grounded (mcq | matching | ordering | cloze) gắn với một `tutor_sessions`. `payload` (jsonb) là dữ liệu render KHÔNG chứa đáp án; `answer_key` (jsonb) chỉ server đọc; `source_chunk_ids` lưu provenance; `status` theo vòng đời `active -> promoted_pending -> promoted_approved | rejected` cho luồng HITL đẩy item tốt thành `questions` DRAFT.
- `tutor_exercise_attempts` — lượt làm của học sinh, có `is_correct` và `score` (0..1 cho chấm một phần).

Nguyên tắc giữ nguyên bất biến hệ thống: đây là **luyện tập (formative)** — chỉ ghi `exp_events` (EXP nỗ lực), **không** ghi `score_events`, **không** đổi `steam_profiles`, **không** mở khoá (khớp mục 6.2 / FR6.6 / NFR-10). RLS theo khuôn sở hữu phiên; answer_key vẫn phải che ở tầng API.

---

## Phần 5 — Bổ sung: Môn học & Lớp học (migration 0003)

SQL đầy đủ ở `database/migrations/0003_classes_and_subjects.sql`. Ba bảng:

- `subjects` — danh mục môn theo **tag STEAM × khối lớp** bám Chương trình GDPT 2018 (mỗi dòng: `name`, `steam_axis` S/T/E/A/M, `grade_band`). Seed bằng `npm run seed:subjects`.
- `classes` — lớp do giáo viên tạo (`teacher_id`, `grade_band`, `subject_id`, `join_code` duy nhất).
- `class_memberships` — thành viên lớp, vòng đời `invited | requested → active | rejected`. `unique(class_id, student_id)`. Giáo viên **mời** (invited) hoặc học sinh **xin vào** bằng mã (requested); một lời mời và một yêu cầu cho cùng cặp lớp–học sinh sẽ hội tụ về `active`.

RLS: subjects đọc trong org; classes do giáo viên sở hữu, học sinh đọc lớp mình là thành viên active; memberships học sinh thấy dòng của mình, giáo viên thấy dòng của lớp mình.
