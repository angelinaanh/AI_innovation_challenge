-- ============================================================
-- Migration 0005 — Class capacity + multi-subject classes
--
-- Feature: giáo viên tạo lớp có thể (a) đặt số thành viên tối đa,
-- (b) chọn NHIỀU môn học cho một lớp (VD lớp liên môn Tin học + Công nghệ).
--
-- classes.subject_id (migration 0003) chỉ cho phép 1 môn/lớp. Thay bằng
-- bảng junction class_subjects, giữ đúng khuôn P2 (junction table thay vì
-- mảng ID) đã dùng cho skill_node_prerequisites — truy vấn ngược được
-- ("lớp nào dạy môn X?") và có ràng buộc khoá ngoại thật.
--
-- Yêu cầu: classes, subjects (xem migration 0003) đã tồn tại.
-- ============================================================

alter table public.classes
  add column if not exists max_members smallint
    check (max_members is null or max_members between 1 and 100);

create table if not exists public.class_subjects (
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  primary key (class_id, subject_id)
);
create index if not exists idx_class_subjects_subject on public.class_subjects (subject_id);

-- Backfill: mỗi lớp đã có 1 subject_id -> 1 dòng junction.
insert into public.class_subjects (class_id, subject_id)
select id, subject_id from public.classes where subject_id is not null
on conflict do nothing;

-- classes.subject_id trở thành nguồn dữ liệu trùng lặp sau khi có
-- class_subjects — bỏ hẳn thay vì giữ hai nguồn sự thật lệch nhau.
alter table public.classes drop column if exists subject_id;

-- ------------------------------------------------------------
-- RLS: đọc/ghi theo đúng khuôn của bảng classes (migration 0003).
-- ------------------------------------------------------------
alter table public.class_subjects enable row level security;

create policy class_subjects_teacher_all on public.class_subjects for all
  using (exists (
    select 1 from public.classes c
    where c.id = class_subjects.class_id and c.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.classes c
    where c.id = class_subjects.class_id and c.teacher_id = auth.uid()
  ));

create policy class_subjects_member_read on public.class_subjects for select
  using (exists (
    select 1 from public.class_memberships m
    where m.class_id = class_subjects.class_id
      and m.student_id = auth.uid() and m.status = 'active'
  ));
