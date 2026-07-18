-- ============================================================
-- Migration 0007 — Bài giảng sinh bởi AI (luồng Lesson Generator)
--
-- Luồng mới: giáo viên upload tài liệu -> AI đề xuất dàn ý -> giáo viên sửa
-- -> AI viết bài giảng chi tiết theo prompt ai/prompts/create_leacturer.md
-- -> giáo viên sửa nội dung -> bấm Hoàn thành -> lưu vào public.lessons.
--
-- Bài giảng loại này KHÁC shape với bản nháp Content Studio cũ:
--   * cũ  (content_format = 'checkpoints'): { title, summary, checkpoints[] }
--   * mới (content_format = 'steam_lesson'): { engage_hook, sections[] với
--          content_blocks, lesson_highlights, evaluation, practical_quest }
-- Cột content_format là discriminator để editor/validator chọn đúng nhánh —
-- nếu thiếu nó, editor cũ sẽ vỡ khi mở bài giảng mới.
--
-- Yêu cầu: lessons, classes (migration 0003+) đã tồn tại.
-- ============================================================
begin;

-- Phân biệt hai shape của lessons.content. Mặc định 'checkpoints' để mọi bản
-- ghi cũ giữ nguyên hành vi với Content Studio hiện có.
alter table public.lessons add column if not exists content_format text
  not null default 'checkpoints';
alter table public.lessons drop constraint if exists lessons_content_format_check;
alter table public.lessons add constraint lessons_content_format_check
  check (content_format in ('checkpoints', 'steam_lesson'));

-- Bài giảng AI gắn trực tiếp với lớp học giáo viên chọn khi bấm Hoàn thành.
alter table public.lessons add column if not exists class_id uuid
  references public.classes(id) on delete set null;
create index if not exists idx_lessons_class on public.lessons (class_id);

-- Giáo viên sở hữu bài giảng. Content Studio cũ suy ra quyền qua
-- source_documents.uploaded_by; luồng mới không tạo source_document nên cần
-- cột chủ sở hữu tường minh.
alter table public.lessons add column if not exists created_by uuid
  references public.profiles(id);
create index if not exists idx_lessons_created_by on public.lessons (created_by);

-- Bài giảng AI chưa gắn vào cây kỹ năng (skill graph) — skill_node_id phải
-- cho phép null. Ràng buộc mới: một trong hai (skill_node_id | class_id) phải
-- có, để không tồn tại bài học mồ côi hoàn toàn.
alter table public.lessons alter column skill_node_id drop not null;
alter table public.lessons drop constraint if exists lessons_owner_scope_check;
alter table public.lessons add constraint lessons_owner_scope_check
  check (skill_node_id is not null or class_id is not null);

-- Quiz của bài giảng AI cũng chưa gắn skill node — nếu giữ NOT NULL thì mọi
-- lần lưu quiz đều vi phạm ràng buộc. Nới giống lessons.skill_node_id ở trên.
alter table public.questions alter column skill_node_id drop not null;
alter table public.questions drop constraint if exists questions_owner_scope_check;
alter table public.questions add constraint questions_owner_scope_check
  check (skill_node_id is not null or lesson_id is not null);

-- Gom các bài học cùng một lần sinh (cùng tài liệu nguồn + dàn ý) thành khóa.
-- Dùng để hiển thị "Chương 1 / Bài 1.1" và sinh lại cả khóa khi cần.
create table if not exists public.ai_lesson_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  teacher_id uuid not null references public.profiles(id),
  class_id uuid references public.classes(id) on delete set null,
  subject text not null,
  grade text not null,
  level text not null check (level in ('Basic', 'Advanced')),
  quiz_count smallint not null default 3 check (quiz_count between 1 and 10),
  -- document_id là namespace Chroma bên ai-service, không phải FK Postgres.
  document_id text,
  source_filename text,
  course_outline jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_courses_teacher on public.ai_lesson_courses (teacher_id, created_at desc);

-- Liên kết bài học -> khóa, kèm vị trí trong cây Chương/Bài để dựng lại thứ tự.
alter table public.lessons add column if not exists ai_course_id uuid
  references public.ai_lesson_courses(id) on delete cascade;
alter table public.lessons add column if not exists chapter_title text;
alter table public.lessons add column if not exists outline_lesson_id text;
alter table public.lessons add column if not exists order_index smallint not null default 0;
create index if not exists idx_lessons_ai_course on public.lessons (ai_course_id, order_index);

commit;
