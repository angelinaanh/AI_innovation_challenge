-- ============================================================
-- Migration 0009 — Gán bài giảng AI vào nhiều lớp học.
--
-- Trước đây một bài giảng thuộc đúng một lớp qua lessons.class_id, gán lúc
-- giáo viên bấm "Hoàn thành". Nhưng một giáo viên thường dạy nhiều lớp cùng
-- khối và muốn dùng lại cùng một bài giảng — quan hệ phải là nhiều-nhiều.
--
-- Sau migration này:
--   * lessons.class_id  = lớp GỐC nơi bài giảng được tạo (giữ để truy vết)
--   * class_lessons     = NGUỒN SỰ THẬT về lớp nào thấy bài giảng nào
--
-- Yêu cầu: lessons, classes, profiles đã tồn tại (migration 0003+, 0007).
-- ============================================================
begin;

create table if not exists public.class_lessons (
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (class_id, lesson_id)
);

create index if not exists idx_class_lessons_lesson on public.class_lessons (lesson_id);
create index if not exists idx_class_lessons_class on public.class_lessons (class_id, assigned_at desc);

-- Backfill: mọi bài giảng AI hiện có giữ nguyên lớp nó đang thuộc về, để học
-- sinh không mất bài nào tại thời điểm chuyển sang đọc theo bảng nối.
insert into public.class_lessons (class_id, lesson_id, assigned_by)
select l.class_id, l.id, l.created_by
from public.lessons l
where l.class_id is not null
  and l.content_format = 'steam_lesson'
on conflict (class_id, lesson_id) do nothing;

alter table public.class_lessons enable row level security;

-- Giáo viên chỉ thao tác trên lớp mình phụ trách.
drop policy if exists class_lessons_teacher_all on public.class_lessons;
create policy class_lessons_teacher_all on public.class_lessons for all
  using (exists (
    select 1 from public.classes c
    where c.id = class_lessons.class_id and c.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.classes c
    where c.id = class_lessons.class_id and c.teacher_id = auth.uid()
  ));

-- Học sinh đang active trong lớp được đọc danh sách bài giảng của lớp đó.
-- Trạng thái PUBLISHED vẫn được kiểm ở tầng service khi đọc bảng lessons.
drop policy if exists class_lessons_member_read on public.class_lessons;
create policy class_lessons_member_read on public.class_lessons for select
  using (exists (
    select 1 from public.class_memberships m
    where m.class_id = class_lessons.class_id
      and m.student_id = auth.uid() and m.status = 'active'
  ));

commit;
