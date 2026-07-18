-- Migration 0011 — Onboarding AI chat profile + Placement Test (M3 / FR2 / P-01, P-02)
--
-- Sau khi học sinh tạo tài khoản, một trợ lý AI thu thập thêm thông tin
-- (trường, còn đi học, trình độ tự đánh giá) và giải đáp về hệ thống, rồi hệ
-- thống sinh "Nhiệm vụ Phân tích Kỹ năng" (placement test) 20-30 câu bám theo
-- khối lớp. Điểm bài test ghi vào score_events(source_type='placement_test') —
-- trigger apply_score_event (migration gốc) sẽ cộng dồn vào steam_profiles.
-- Tổng điểm quyết định lộ trình Cơ bản (<50%) / Nâng cao (>=50%).

-- 1. Bổ sung cột hồ sơ do bước onboarding thu thập.
alter table public.profiles add column if not exists school_name text;
alter table public.profiles add column if not exists is_enrolled boolean;
alter table public.profiles add column if not exists self_reported_grade smallint
  check (self_reported_grade between 1 and 12);
alter table public.profiles add column if not exists learning_track text
  check (learning_track in ('basic','advanced'));
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists placement_completed_at timestamptz;

-- 2. Một lượt placement test của học sinh.
create table if not exists public.placement_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  grade_level smallint not null check (grade_level between 1 and 12),
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted')),
  generated_by text,                       -- tên model AI hoặc 'deterministic-fallback'
  total_questions int not null default 0,
  total_correct int,
  score_percent numeric(5,2),
  track text check (track in ('basic','advanced')),
  steam_result jsonb,                      -- {"S":62,"T":40,...} điểm 0-100 từng trục
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index if not exists idx_placement_tests_user
  on public.placement_tests (user_id, created_at desc);

-- 3. Câu hỏi của một lượt test. answer_index giữ ở server, không gửi cho client
--    khi đang làm bài.
create table if not exists public.placement_questions (
  id uuid primary key default gen_random_uuid(),
  placement_test_id uuid not null references public.placement_tests(id) on delete cascade,
  order_index int not null,
  steam_axis text not null check (steam_axis in ('S','T','E','A','M')),
  difficulty text not null default 'medium'
    check (difficulty in ('easy','medium','hard')),
  body text not null,
  options jsonb not null,                  -- ["A","B","C","D"]
  answer_index int not null,
  explanation text,
  created_at timestamptz not null default now()
);
create index if not exists idx_placement_questions_test
  on public.placement_questions (placement_test_id, order_index);

-- 4. Câu trả lời của học sinh (append-only, phục vụ truy vết).
create table if not exists public.placement_answers (
  id uuid primary key default gen_random_uuid(),
  placement_test_id uuid not null references public.placement_tests(id) on delete cascade,
  question_id uuid not null references public.placement_questions(id) on delete cascade,
  selected_index int,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (placement_test_id, question_id)
);

-- 5. RLS — nhất quán với phần còn lại: service_role của backend bỏ qua RLS,
--    các policy owner-only dưới đây bảo vệ khi truy cập bằng anon/authenticated key.
alter table public.placement_tests enable row level security;
alter table public.placement_questions enable row level security;
alter table public.placement_answers enable row level security;

drop policy if exists placement_tests_owner on public.placement_tests;
create policy placement_tests_owner on public.placement_tests
  for select using (user_id = auth.uid());

drop policy if exists placement_questions_owner on public.placement_questions;
create policy placement_questions_owner on public.placement_questions
  for select using (exists (
    select 1 from public.placement_tests t
    where t.id = placement_questions.placement_test_id and t.user_id = auth.uid()
  ));

drop policy if exists placement_answers_owner on public.placement_answers;
create policy placement_answers_owner on public.placement_answers
  for select using (exists (
    select 1 from public.placement_tests t
    where t.id = placement_answers.placement_test_id and t.user_id = auth.uid()
  ));
