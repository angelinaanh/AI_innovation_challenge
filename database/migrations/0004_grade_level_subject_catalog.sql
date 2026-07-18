-- Migration 0004: exact grade 1-12 and the 101-row STEAM catalog.
-- Safe to rerun after a failed or completed attempt.
begin;

alter table public.profiles add column if not exists grade_level smallint;
alter table public.subjects add column if not exists grade_level smallint;
alter table public.classes add column if not exists grade_level smallint;

alter table public.classes drop constraint if exists classes_subject_grade_level_fkey;
alter table public.subjects drop constraint if exists subjects_id_grade_level_key;
alter table public.subjects drop constraint if exists subjects_org_name_grade_level_key;
alter table public.subjects drop constraint if exists subjects_org_id_name_grade_band_steam_axis_key;
alter table public.profiles drop constraint if exists profiles_grade_level_check;
alter table public.profiles drop constraint if exists profiles_student_grade_level_required;
alter table public.profiles drop constraint if exists profiles_grade_band_consistency;
alter table public.subjects drop constraint if exists subjects_grade_level_check;
alter table public.subjects drop constraint if exists subjects_grade_band_consistency;
alter table public.classes drop constraint if exists classes_grade_level_check;
alter table public.classes drop constraint if exists classes_grade_band_consistency;

update public.subjects set name = 'Tự nhiên và Xã hội' where name = 'Tự nhiên & Xã hội';
update public.subjects set name = 'Lịch sử và Địa lý' where name = 'Lịch sử & Địa lý';

update public.subjects set grade_level = case name
  when 'Tự nhiên và Xã hội' then 1 when 'Khoa học' then 4
  when 'Khoa học tự nhiên' then 6 when 'Vật lý' then 10
  when 'Hóa học' then 10 when 'Sinh học' then 10
  when 'Tin học' then case grade_band when 'primary' then 3 when 'secondary' then 6 else 10 end
  when 'Công nghệ' then case grade_band when 'primary' then 3 when 'secondary' then 6 else 10 end
  when 'Tiếng Việt' then 1 when 'Ngữ văn' then case grade_band when 'secondary' then 6 else 10 end
  when 'Mỹ thuật' then case grade_band when 'primary' then 1 when 'secondary' then 6 else 10 end
  when 'Âm nhạc' then case grade_band when 'primary' then 1 when 'secondary' then 6 else 10 end
  when 'Đạo đức' then 1 when 'Lịch sử và Địa lý' then 6
  when 'Lịch sử' then 10 when 'Địa lý' then 10
  when 'Toán' then case grade_band when 'primary' then 1 when 'secondary' then 6 else 10 end
  else null end
where grade_level is null;

update public.profiles set grade_level = case grade_band
  when 'primary' then 1 when 'secondary' then 6 when 'high_school' then 10 end
where grade_level is null and grade_band is not null;
update public.classes set grade_level = case grade_band
  when 'primary' then 1 when 'secondary' then 6 when 'high_school' then 10 end
where grade_level is null;
update public.classes c set grade_level = s.grade_level, grade_band = s.grade_band
from public.subjects s where c.subject_id = s.id and s.grade_level is not null;
update public.classes set subject_id = null where subject_id in
  (select id from public.subjects where grade_level is null);
delete from public.subjects where grade_level is null;

create unique index if not exists subjects_org_name_grade_level_uidx
  on public.subjects(org_id, name, grade_level);

with definitions(name, steam_axis, grades) as (values
  ('Tự nhiên và Xã hội','S',array[1,2,3]), ('Khoa học','S',array[4,5]),
  ('Khoa học tự nhiên','S',array[6,7,8,9]), ('Vật lý','S',array[10,11,12]),
  ('Hóa học','S',array[10,11,12]), ('Sinh học','S',array[10,11,12]),
  ('Tin học','T',array[3,4,5,6,7,8,9,10,11,12]),
  ('Công nghệ','E',array[3,4,5,6,7,8,9,10,11,12]),
  ('Tiếng Việt','A',array[1,2,3,4,5]),
  ('Ngữ văn','A',array[6,7,8,9,10,11,12]),
  ('Mỹ thuật','A',array[1,2,3,4,5,6,7,8,9,10,11,12]),
  ('Âm nhạc','A',array[1,2,3,4,5,6,7,8,9,10,11,12]),
  ('Đạo đức','A',array[1,2,3,4,5]),
  ('Lịch sử và Địa lý','A',array[6,7,8,9]),
  ('Lịch sử','A',array[10,11,12]), ('Địa lý','A',array[10,11,12]),
  ('Toán','M',array[1,2,3,4,5,6,7,8,9,10,11,12])
), catalog as (
  select name, steam_axis, grade_level,
    case when grade_level <= 5 then 'primary'
         when grade_level <= 9 then 'secondary' else 'high_school' end grade_band
  from definitions cross join lateral unnest(grades) grade_level
)
insert into public.subjects(org_id,name,steam_axis,grade_level,grade_band)
select o.id,c.name,c.steam_axis,c.grade_level,c.grade_band
from public.organizations o cross join catalog c
on conflict (org_id,name,grade_level) do update
set steam_axis=excluded.steam_axis, grade_band=excluded.grade_band;

alter table public.subjects alter column grade_level set not null;
alter table public.classes alter column grade_level set not null;
alter table public.profiles add constraint profiles_grade_level_check
  check (grade_level is null or grade_level between 1 and 12);
alter table public.profiles add constraint profiles_student_grade_level_required
  check (role::text <> 'student' or (grade_level is not null and grade_band is not null));
alter table public.profiles add constraint profiles_grade_band_consistency check (
  (grade_level is null and grade_band is null) or grade_band = case
    when grade_level <= 5 then 'primary' when grade_level <= 9 then 'secondary' else 'high_school' end);
alter table public.subjects add constraint subjects_grade_level_check check (grade_level between 1 and 12);
alter table public.subjects add constraint subjects_grade_band_consistency check (
  grade_band = case when grade_level <= 5 then 'primary'
    when grade_level <= 9 then 'secondary' else 'high_school' end);
alter table public.classes add constraint classes_grade_level_check check (grade_level between 1 and 12);
alter table public.classes add constraint classes_grade_band_consistency check (
  grade_band = case when grade_level <= 5 then 'primary'
    when grade_level <= 9 then 'secondary' else 'high_school' end);

create unique index if not exists subjects_id_grade_level_uidx on public.subjects(id,grade_level);
alter table public.classes add constraint classes_subject_grade_level_fkey
  foreign key(subject_id,grade_level) references public.subjects(id,grade_level);
create index if not exists idx_subjects_grade_level on public.subjects(org_id,grade_level,steam_axis);
create index if not exists idx_classes_grade_level on public.classes(org_id,grade_level);

commit;

-- Expected verification: 101 rows per organization, grades 1 through 12.
select grade_level, count(*) as subject_count
from public.subjects group by grade_level order by grade_level;
