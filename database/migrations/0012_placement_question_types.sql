-- Migration 0012 — Cập nhật cấu trúc câu hỏi Placement Test để hỗ trợ Tự luận, Điền khuyết và Ảnh

-- 1. Cho phép options và answer_index được null (vì câu Tự luận/Điền khuyết không có mảng lựa chọn)
alter table public.placement_questions alter column options drop not null;
alter table public.placement_questions alter column answer_index drop not null;

-- 2. Bổ sung các cột mới vào placement_questions
alter table public.placement_questions add column if not exists type text not null default 'mcq' check (type in ('mcq', 'fill_blank', 'open'));
alter table public.placement_questions add column if not exists image_url text;
alter table public.placement_questions add column if not exists rubric text;
alter table public.placement_questions add column if not exists accepted_answers jsonb;

-- 3. Bổ sung các cột mới vào placement_answers
alter table public.placement_answers add column if not exists text_answer text;
alter table public.placement_answers add column if not exists formative_feedback text;
alter table public.placement_answers add column if not exists score_fraction numeric(3,2) not null default 0 check (score_fraction >= 0 and score_fraction <= 1);
