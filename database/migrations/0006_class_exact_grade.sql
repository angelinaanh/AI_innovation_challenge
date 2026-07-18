-- ============================================================
-- Migration 0006 — Chọn lớp cụ thể (1-12) khi tạo lớp học
--
-- classes.grade_band (migration 0003) chỉ có 3 mức, không đủ để giáo viên
-- chọn đúng "Lớp 6" thay vì chỉ "THCS", và không đủ để khớp chính xác với
-- subjects.min_grade/max_grade (migration 0004) khi kiểm tra môn học có
-- dạy ở đúng lớp đó không (VD lớp 1 không được chọn môn "Khoa học",
-- vốn chỉ dạy lớp 4-5, dù cùng band 'primary').
--
-- Yêu cầu: classes, grades, subjects.min_grade/max_grade
-- (migration 0003, 0004) đã tồn tại và migration 0004 đã được apply.
-- ============================================================

alter table public.classes
  add column if not exists grade smallint references public.grades(grade_number);

-- Nullable: các lớp tạo trước migration này không có dữ liệu để suy ra
-- đúng 1 con số từ grade_band, nên giữ null thay vì đoán. Lớp tạo mới
-- sau migration này bắt buộc có grade (ép ở tầng service, xem
-- classroomService.js createClass).
alter table public.classes
  add constraint classes_grade_in_band check (
    grade is null
    or (grade_band = 'primary' and grade between 1 and 5)
    or (grade_band = 'secondary' and grade between 6 and 9)
    or (grade_band = 'high_school' and grade between 10 and 12)
  );

create index if not exists idx_classes_grade on public.classes (grade);
