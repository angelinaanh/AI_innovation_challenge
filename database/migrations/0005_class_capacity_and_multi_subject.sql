-- Migration 0005: class capacity + multi-subject classes on exact grade_level.
-- Safe to rerun after a failed or completed attempt.
begin;

alter table public.classes
  add column if not exists max_members smallint
    check (max_members is null or max_members between 1 and 100);

alter table public.classes drop constraint if exists classes_subject_grade_level_fkey;

create table if not exists public.class_subjects (
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  grade_level smallint,
  primary key (class_id, subject_id)
);

alter table public.class_subjects
  add column if not exists grade_level smallint;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'subject_id'
  ) then
    insert into public.class_subjects (class_id, subject_id, grade_level)
    select id, subject_id, grade_level
    from public.classes
    where subject_id is not null
    on conflict (class_id, subject_id) do update
    set grade_level = excluded.grade_level;
  end if;
end $$;

update public.class_subjects cs
set grade_level = c.grade_level
from public.classes c
where cs.class_id = c.id and cs.grade_level is null;

update public.class_subjects cs
set subject_id = replacement.id, grade_level = c.grade_level
from public.classes c
join public.subjects current_subject on current_subject.id = cs.subject_id
join public.subjects replacement
  on replacement.org_id = current_subject.org_id
  and replacement.name = current_subject.name
  and replacement.grade_level = c.grade_level
where cs.class_id = c.id
  and c.grade_level is not null
  and current_subject.grade_level is distinct from c.grade_level;

alter table public.class_subjects alter column grade_level set not null;

alter table public.class_subjects drop constraint if exists class_subjects_grade_level_check;
alter table public.class_subjects add constraint class_subjects_grade_level_check
  check (grade_level between 1 and 12);

create unique index if not exists classes_id_grade_level_uidx
  on public.classes(id, grade_level);
create unique index if not exists subjects_id_grade_level_uidx
  on public.subjects(id, grade_level);

alter table public.class_subjects drop constraint if exists class_subjects_class_grade_level_fkey;
alter table public.class_subjects add constraint class_subjects_class_grade_level_fkey
  foreign key (class_id, grade_level) references public.classes(id, grade_level) on delete cascade;

alter table public.class_subjects drop constraint if exists class_subjects_subject_grade_level_fkey;
alter table public.class_subjects add constraint class_subjects_subject_grade_level_fkey
  foreign key (subject_id, grade_level) references public.subjects(id, grade_level);

create index if not exists idx_class_subjects_subject on public.class_subjects(subject_id);
create index if not exists idx_class_subjects_grade on public.class_subjects(grade_level, subject_id);

alter table public.classes drop column if exists subject_id;

alter table public.class_subjects enable row level security;

drop policy if exists class_subjects_teacher_all on public.class_subjects;
create policy class_subjects_teacher_all on public.class_subjects for all
  using (exists (
    select 1 from public.classes c
    where c.id = class_subjects.class_id and c.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.classes c
    where c.id = class_subjects.class_id and c.teacher_id = auth.uid()
  ));

drop policy if exists class_subjects_member_read on public.class_subjects;
create policy class_subjects_member_read on public.class_subjects for select
  using (exists (
    select 1 from public.class_memberships m
    where m.class_id = class_subjects.class_id
      and m.student_id = auth.uid() and m.status = 'active'
  ));

commit;
