-- ============================================================
-- Migration 0002 — Tutor interactive formative exercises
-- Feature: AI Tutor sinh bài luyện tập tương tác (MCQ, matching,
-- ordering, cloze) grounded trên học liệu đã duyệt.
--
-- Nguyên tắc an toàn (khớp NFR-10 / mục 6.2 Proposal):
--   * Đây là LUYỆN TẬP (formative), KHÔNG phải đánh giá (summative).
--   * Không ghi score_events, không đổi steam_profiles, không mở khoá.
--   * Chỉ thưởng EXP nỗ lực nhỏ qua exp_events (tách khỏi STEAM).
--   * answer_key nằm ở server (RLS chặn học sinh đọc), giống questions.
--   * Có luồng HITL: học sinh đề xuất -> giáo viên duyệt -> câu hỏi thật.
--
-- Yêu cầu: các bảng tutor_sessions, skill_nodes, profiles, questions
-- (xem docs/databasedesign.md) đã tồn tại.
-- ============================================================

create table if not exists public.tutor_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutor_sessions(id) on delete cascade,
  skill_node_id uuid not null references public.skill_nodes(id),
  type text not null check (type in ('mcq','matching','ordering','cloze')),
  prompt text not null,
  payload jsonb not null,               -- dữ liệu render, KHÔNG chứa đáp án
  answer_key jsonb not null,            -- chỉ server đọc (RLS chặn học sinh)
  source_chunk_ids uuid[],              -- provenance: chunk đã duyệt dùng để grounding
  generated_by text,                    -- model id, phục vụ NFR-7 / audit
  status text not null default 'active'
    check (status in ('active','promoted_pending','promoted_approved','rejected')),
  promoted_by uuid references public.profiles(id),
  assigned_teacher_id uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  resulting_question_id uuid references public.questions(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_tutor_exercises_session on public.tutor_exercises (session_id);
create index if not exists idx_tutor_exercises_status on public.tutor_exercises (status, assigned_teacher_id);

create table if not exists public.tutor_exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.tutor_exercises(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  response jsonb not null,
  is_correct boolean not null,
  score numeric(4,3) not null default 0,  -- 0..1, cho phép chấm một phần (matching/ordering)
  created_at timestamptz not null default now()
);
create index if not exists idx_exercise_attempts_user on public.tutor_exercise_attempts (user_id, exercise_id);

-- ------------------------------------------------------------
-- RLS (khuôn giống các bảng hội thoại Tutor):
--   * Học sinh chỉ đọc/ghi bài luyện & lượt làm của CHÍNH MÌNH.
--   * answer_key vẫn phải được che ở tầng API (không select cho học sinh);
--     RLS ở đây là lớp phòng thủ thứ hai theo phiên sở hữu.
--   * Giáo viên/Admin đọc được item ở trạng thái promoted_* để duyệt.
-- ------------------------------------------------------------
alter table public.tutor_exercises enable row level security;
alter table public.tutor_exercise_attempts enable row level security;

create policy tutor_exercises_owner on public.tutor_exercises for select
  using (
    exists (
      select 1 from public.tutor_sessions s
      where s.id = tutor_exercises.session_id and s.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('teacher','admin')
    )
  );

create policy exercise_attempts_owner on public.tutor_exercise_attempts for select
  using (user_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.role in ('teacher','admin')));
create policy exercise_attempts_insert on public.tutor_exercise_attempts for insert
  with check (user_id = auth.uid());
