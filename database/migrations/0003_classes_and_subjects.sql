-- ============================================================
-- Migration 0003 — Subjects catalog + Classes + memberships
--
-- Feature: giáo viên tạo lớp (gắn khối lớp + môn theo tag STEAM), mời học
-- sinh hoặc duyệt yêu cầu tham gia; học sinh xin vào lớp hoặc chấp nhận lời mời.
-- Danh mục môn học bám bảng phân loại STEAM theo GDPT 2018.
--
-- Yêu cầu: organizations, profiles (xem docs/databasedesign.md) đã tồn tại.
-- ============================================================

-- Danh mục môn học, mỗi môn gắn 1 trục STEAM và 1 khối lớp (GDPT 2018).
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  name text not null,
  steam_axis text not null check (steam_axis in ('S','T','E','A','M')),
  grade_band text not null check (grade_band in ('primary','secondary','high_school')),
  created_at timestamptz not null default now(),
  unique (org_id, name, grade_band, steam_axis)
);
create index if not exists idx_subjects_band on public.subjects (org_id, grade_band);

-- Lớp học do giáo viên tạo.
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  teacher_id uuid not null references public.profiles(id),
  name text not null,
  grade_band text not null check (grade_band in ('primary','secondary','high_school')),
  subject_id uuid references public.subjects(id),
  description text,
  join_code text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_classes_teacher on public.classes (teacher_id);

-- Thành viên lớp — luồng hai chiều: mời (invited) hoặc xin vào (requested),
-- rồi chuyển active khi được chấp nhận/duyệt, hoặc rejected.
create table if not exists public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('invited','requested','active','rejected')),
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (class_id, student_id)
);
create index if not exists idx_memberships_student on public.class_memberships (student_id, status);
create index if not exists idx_memberships_class on public.class_memberships (class_id, status);

-- ------------------------------------------------------------
-- RLS (phòng thủ nhiều lớp; API vẫn kiểm ở tầng server):
--   * subjects: mọi người trong org đọc được.
--   * classes: giáo viên đọc/sửa lớp của mình; học sinh đọc lớp mình là thành viên.
--   * memberships: học sinh thấy dòng của mình; giáo viên thấy dòng của lớp mình.
-- ------------------------------------------------------------
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;

create policy subjects_read on public.subjects for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.org_id = subjects.org_id));

create policy classes_teacher_all on public.classes for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
create policy classes_member_read on public.classes for select
  using (exists (
    select 1 from public.class_memberships m
    where m.class_id = classes.id and m.student_id = auth.uid() and m.status = 'active'
  ));

create policy memberships_student on public.class_memberships for select
  using (student_id = auth.uid());
create policy memberships_teacher on public.class_memberships for select
  using (exists (
    select 1 from public.classes c where c.id = class_memberships.class_id and c.teacher_id = auth.uid()
  ));
