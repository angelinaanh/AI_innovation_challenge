-- ============================================================
-- Migration 0008 — Reconcile class_subjects với migration 0005.
--
-- Triệu chứng trên DB thật: public.class_subjects tồn tại nhưng CHỈ có
-- (class_id, subject_id) — cột grade_level và hai khóa ngoại ghép của
-- migration 0005 chưa được áp dụng. Hệ quả: createClass() ghi grade_level và
-- PostgREST trả PGRST204 "Could not find the 'grade_level' column", nên KHÔNG
-- tạo được lớp nào.
--
-- Migration này chỉ đụng tới class_subjects (và hai unique index nó cần), nên
-- an toàn hơn việc chạy lại toàn bộ 0005. Rerun được nhiều lần.
-- ============================================================
begin;

-- Trường hợp bảng chưa tồn tại: tạo đủ ngay từ đầu.
create table if not exists public.class_subjects (
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  grade_level smallint,
  primary key (class_id, subject_id)
);

-- Trường hợp bảng đã tồn tại thiếu cột: bổ sung.
alter table public.class_subjects add column if not exists grade_level smallint;

-- Backfill từ lớp chứa nó trước khi siết NOT NULL.
update public.class_subjects cs
set grade_level = c.grade_level
from public.classes c
where cs.class_id = c.id and cs.grade_level is null;

-- Nếu lớp đã có sẵn hàng trỏ đúng môn/đúng khối, thì hàng trỏ sai khối cùng
-- tên là bản trùng: nắn nó sẽ va chạm primary key (class_id, subject_id).
-- Xóa bản trùng trước, giữ lại hàng đã đúng.
delete from public.class_subjects duplicate
using public.classes c,
     public.subjects current_subject,
     public.subjects replacement
where duplicate.class_id = c.id
  and current_subject.id = duplicate.subject_id
  and replacement.org_id = current_subject.org_id
  and replacement.name = current_subject.name
  and replacement.grade_level = c.grade_level
  and current_subject.grade_level is distinct from c.grade_level
  and exists (
    select 1 from public.class_subjects kept
    where kept.class_id = duplicate.class_id and kept.subject_id = replacement.id
  );

-- Hàng trỏ sang bản ghi môn của khối khác (dữ liệu cũ từ thời chọn môn tự do)
-- được nắn về đúng môn cùng tên trong khối của lớp.
--
-- Lưu ý cú pháp: Postgres KHÔNG cho tham chiếu bảng đích (cs) trong điều kiện
-- JOIN của mệnh đề FROM — "invalid reference to FROM-clause entry". Vì vậy các
-- bảng nguồn phải liệt kê bằng dấu phẩy và mọi điều kiện nối đặt trong WHERE.
update public.class_subjects cs
set subject_id = replacement.id, grade_level = c.grade_level
from public.classes c,
     public.subjects current_subject,
     public.subjects replacement
where cs.class_id = c.id
  and current_subject.id = cs.subject_id
  and replacement.org_id = current_subject.org_id
  and replacement.name = current_subject.name
  and replacement.grade_level = c.grade_level
  and c.grade_level is not null
  and current_subject.grade_level is distinct from c.grade_level;

-- Hàng mồ côi không backfill được (lớp đã bị xóa) thì bỏ, nếu không bước
-- SET NOT NULL bên dưới sẽ thất bại.
delete from public.class_subjects where grade_level is null;

alter table public.class_subjects alter column grade_level set not null;

alter table public.class_subjects drop constraint if exists class_subjects_grade_level_check;
alter table public.class_subjects add constraint class_subjects_grade_level_check
  check (grade_level between 1 and 12);

-- Khóa ngoại ghép cần unique index tương ứng ở bảng cha.
create unique index if not exists classes_id_grade_level_uidx
  on public.classes(id, grade_level);
create unique index if not exists subjects_id_grade_level_uidx
  on public.subjects(id, grade_level);

-- Ràng buộc cốt lõi: môn gán vào lớp phải đúng khối của lớp đó. Đây là thứ
-- chặn ở tầng DB điều mà validateClassSubjects() chặn ở tầng service.
alter table public.class_subjects drop constraint if exists class_subjects_class_grade_level_fkey;
alter table public.class_subjects add constraint class_subjects_class_grade_level_fkey
  foreign key (class_id, grade_level) references public.classes(id, grade_level) on delete cascade;

alter table public.class_subjects drop constraint if exists class_subjects_subject_grade_level_fkey;
alter table public.class_subjects add constraint class_subjects_subject_grade_level_fkey
  foreign key (subject_id, grade_level) references public.subjects(id, grade_level);

create index if not exists idx_class_subjects_subject on public.class_subjects(subject_id);
create index if not exists idx_class_subjects_grade on public.class_subjects(grade_level, subject_id);

commit;
