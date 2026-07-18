# Lesson Generator (Human-in-the-Loop) — Prompt Reference

Nguồn sự thật chạy thật: `ai-service/app/prompts.py` (LangChain `ChatPromptTemplate`). File này là bản tài liệu hoá theo working rule của repo.

## Prompt 1 — Generate Course Outline (STEAM Syllabus)

- **Persona:** Chuyên gia Phát triển Chương trình Giảng dạy STEAM.
- **Ngữ cảnh:** Môn `{subject}`, Lớp `{grade}`, Trình độ `{level_label}` (Cơ bản/Nâng cao), `{quiz_count}` câu quiz mỗi bài.
- **Input:** các chunk đầu tài liệu giáo viên upload (cái nhìn toàn cục).
- **Quy tắc:** chỉ dùng kiến thức trong tài liệu nguồn; cấu trúc phân tầng Chương → Bài học → Mục; mỗi bài ước tính thời lượng (tối thiểu 5 phút); trình độ Cơ bản thiên khái niệm nền tảng, Nâng cao thiên phân tích/vận dụng; mỗi bài có mục "Góc nhìn STEAM" (liên hệ thực tế/liên môn) cuối phần lý thuyết và mục "Kiểm tra & Ôn tập" ghi rõ số câu hỏi.
- **Output constraint:** STRICT JSON `{"course_outline": {subject, target_grade, overall_objective, chapters: [{chapter_id, chapter_title, chapter_objective, lessons: [{lesson_id, lesson_title, estimated_time_minutes, sections: [{section_id, section_title, intent}]}]}]}}` — không markdown fence.
- Server flatten mỗi `section` thành một outline item phẳng (`title = lesson_title — section_title`, `description = intent`) để bước generate giữ nguyên hợp đồng API.

## Prompt 2 — Generate Detailed Content & Quizzes

- **Ngữ cảnh:** Lớp `{grade}`, Trình độ `{level}`; chạy cho TỪNG mục dàn ý đã được giáo viên duyệt.
- **Input:** top-4 chunks truy hồi từ ChromaDB theo query `"{title}. {description}"` của mục.
- **Nhiệm vụ chính:** viết 250-500 từ Markdown cho mục `{outline_title}: {outline_description}`, dựa một phần vào Retrieved Context, in đậm từ khóa, chia đoạn ngắn, có ví dụ thực tế.
- **Nhiệm vụ phụ:** sinh `{quiz_count}` câu trắc nghiệm 4 lựa chọn liên quan trực tiếp nội dung vừa viết, kèm explanation.
- **Output constraint:** JSON thuần `{"content": "<markdown>", "quizzes": [...]}`.

## Guardrails phía server

- `correct_answer` phải trùng nguyên văn một phần tử `options`, nếu không câu quiz bị loại.
- Output là **bản nháp** — chỉ giáo viên thấy; không có đường publish trực tiếp tới học sinh từ service này.
