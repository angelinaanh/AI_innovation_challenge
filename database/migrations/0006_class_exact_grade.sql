-- Migration 0006: reconcile the older classes.grade approach with grade_level.
-- The canonical schema now uses classes.grade_level from migration 0004.
begin;

alter table public.classes add column if not exists grade_level smallint;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'grade'
  ) then
    update public.classes
    set grade_level = coalesce(grade_level, grade)
    where grade is not null;
  end if;
end $$;

alter table public.classes drop constraint if exists classes_grade_in_band;
drop index if exists public.idx_classes_grade;
alter table public.classes drop column if exists grade;

alter table public.classes drop constraint if exists classes_grade_level_check;
alter table public.classes add constraint classes_grade_level_check
  check (grade_level between 1 and 12);

alter table public.classes drop constraint if exists classes_grade_band_consistency;
alter table public.classes add constraint classes_grade_band_consistency check (
  grade_band = case
    when grade_level <= 5 then 'primary'
    when grade_level <= 9 then 'secondary'
    else 'high_school'
  end
);

create index if not exists idx_classes_grade_level on public.classes(org_id, grade_level);

commit;
