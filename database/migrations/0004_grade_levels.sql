-- ============================================================
-- Migration 0004 — Grade levels (1-12) + phạm vi lớp chính xác theo môn
--
-- Vấn đề: subjects.grade_band (migration 0003) chỉ có 3 giá trị
-- (primary/secondary/high_school) nên không phân biệt được, ví dụ,
-- "Tự nhiên & Xã hội" (chỉ dạy lớp 1-3) với "Khoa học" (chỉ dạy lớp 4-5)
-- dù cả hai cùng nằm trong band 'primary'. Hệ quả: học sinh lớp 1 hiện
-- có thể thấy nhầm môn Khoa học vốn dành cho lớp 4-5.
--
-- Yêu cầu: subjects (xem migration 0003) đã tồn tại và đã seed 28 dòng.
-- ============================================================

-- Bảng tra cứu lớp 1-12 — dùng cho dropdown UI và ràng buộc khoá ngoại,
-- tách khỏi grade_band (band vẫn giữ để không phá các bảng khác đang
-- dùng nó: profiles, classes, skill_nodes).
create table if not exists public.grades (
  grade_number smallint primary key check (grade_number between 1 and 12),
  grade_band text not null check (grade_band in ('primary','secondary','high_school'))
);

insert into public.grades (grade_number, grade_band)
select g, case
    when g between 1 and 5 then 'primary'
    when g between 6 and 9 then 'secondary'
    else 'high_school'
  end
from generate_series(1, 12) as g
on conflict (grade_number) do nothing;

-- Phạm vi lớp chính xác cho từng môn.
alter table public.subjects
  add column if not exists min_grade smallint references public.grades(grade_number),
  add column if not exists max_grade smallint references public.grades(grade_number);

-- Backfill 28 dòng đã seed theo đúng phạm vi lớp thật (GDPT 2018, theo
-- danh sách giáo viên cung cấp). Idempotent: chạy lại không đổi kết quả.
update public.subjects set min_grade = 1, max_grade = 3
  where name = 'Tự nhiên & Xã hội' and grade_band = 'primary';
update public.subjects set min_grade = 4, max_grade = 5
  where name = 'Khoa học' and grade_band = 'primary';
update public.subjects set min_grade = 3, max_grade = 5
  where name = 'Tin học' and grade_band = 'primary';
update public.subjects set min_grade = 3, max_grade = 5
  where name = 'Công nghệ' and grade_band = 'primary';
update public.subjects set min_grade = 1, max_grade = 5
  where name in ('Tiếng Việt', 'Mỹ thuật', 'Âm nhạc', 'Đạo đức', 'Toán')
    and grade_band = 'primary';

update public.subjects set min_grade = 6, max_grade = 9
  where grade_band = 'secondary';

update public.subjects set min_grade = 10, max_grade = 12
  where grade_band = 'high_school';

alter table public.subjects
  alter column min_grade set not null,
  alter column max_grade set not null;

alter table public.subjects
  add constraint subjects_grade_range_valid check (min_grade <= max_grade),
  add constraint subjects_grade_range_in_band check (
    (grade_band = 'primary' and min_grade between 1 and 5 and max_grade between 1 and 5)
    or (grade_band = 'secondary' and min_grade between 6 and 9 and max_grade between 6 and 9)
    or (grade_band = 'high_school' and min_grade between 10 and 12 and max_grade between 10 and 12)
  );

create index if not exists idx_subjects_grade_range on public.subjects (min_grade, max_grade);

-- ------------------------------------------------------------
-- RLS: grades là bảng tra cứu tĩnh, mọi user đã đăng nhập đọc được.
-- ------------------------------------------------------------
alter table public.grades enable row level security;

create policy grades_read_authenticated on public.grades for select
  using (auth.role() = 'authenticated');
