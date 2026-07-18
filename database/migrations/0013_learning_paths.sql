-- ============================================================
-- Migration 0013 — Lộ trình học theo môn (Learning Paths)
--
-- Chuẩn hoá nội dung lộ trình học (Mục lớn → Chương → Bài học → Bonus) cho từng
-- môn/lớp vào DB thay vì hardcode ở frontend. Dùng chung một "template" cho mọi
-- môn (giống môn Toán), phục vụ trang Lộ trình học chi tiết dạng gamification.
--
--   * learning_paths          — nội dung syllabus mỗi (grade, subject_key)
--   * learning_path_progress  — tiến độ hoàn thành bài/bonus của mỗi học sinh
--
-- Seed nội dung bằng: npm run seed:learning (backend/scripts/seedLearningPaths.js)
-- Backend luôn có fallback từ syllabusData.js nên tính năng chạy được cả khi
-- bảng chưa seed.
-- ============================================================
begin;

-- Nội dung lộ trình học (không gắn org — theo chương trình chuẩn quốc gia).
-- `data` giữ nguyên cây { name, summary, objectives, bonusMeta, parts } để phục
-- vụ trực tiếp cho UI mà không cần nhiều bảng con.
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  grade integer not null check (grade between 1 and 12),
  subject_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (grade, subject_key)
);

-- Tiến độ học của từng học sinh trên một môn/lớp. `completed` là mảng id các
-- bài/bonus đã hoàn thành (vd "c1#0", "c1#bonus") — khớp id sinh ở frontend.
create table if not exists public.learning_path_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  grade integer not null check (grade between 1 and 12),
  subject_key text not null,
  completed jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (student_id, grade, subject_key)
);

create index if not exists idx_lpp_student on public.learning_path_progress (student_id);

-- Mọi truy cập đi qua backend service-role (bỏ qua RLS). Bật RLS + policy tối
-- thiểu để an toàn nếu sau này có client truy cập trực tiếp.
alter table public.learning_paths enable row level security;
alter table public.learning_path_progress enable row level security;

drop policy if exists learning_paths_read on public.learning_paths;
create policy learning_paths_read on public.learning_paths
  for select using (true);

drop policy if exists lpp_self_all on public.learning_path_progress;
create policy lpp_self_all on public.learning_path_progress
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

commit;
