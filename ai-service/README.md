# EduOne AI Content Service (Python)

Microservice FastAPI cho tính năng **Tạo bài giảng bằng AI (Human-in-the-Loop)** — chạy độc lập với backend Node/Express.

## Luồng nghiệp vụ

1. `POST /api/teacher/content/outline` — giáo viên upload PDF/TXT + (subject, grade, level, quiz_count). Hệ thống parse tài liệu, chunk theo token (1000/200), embed và lưu ChromaDB theo `document_id`, rồi gọi LLM (Prompt 1) sinh dàn ý.
2. Giáo viên **sửa và chốt dàn ý trên UI** (bước human-in-the-loop).
3. `POST /api/teacher/content/generate` — nhận dàn ý đã duyệt + `document_id`. Với từng mục dàn ý: truy hồi top-4 chunks liên quan từ ChromaDB, gọi LLM (Prompt 2) viết nội dung Markdown + quiz. Gom lại thành bài giảng hoàn chỉnh.

## Cấu trúc

```text
app/
  main.py            FastAPI app + CORS + health
  config.py          Settings (env-driven)
  schemas.py         Phần 1 — Pydantic schemas
  rag.py             Phần 2 — RAG pipeline (parse, split, embed, retrieve)
  prompts.py         Phần 3 — LangChain prompt templates
  llm.py             Gọi LLM + parse/validate JSON output
  routers/content.py Phần 4 — 2 endpoints
```

## Chạy local

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env         # điền OPENAI_API_KEY thật
uvicorn app.main:app --reload --port 8000
```

Swagger UI: <http://127.0.0.1:8000/docs>

## Thử nhanh

```bash
curl -X POST http://127.0.0.1:8000/api/teacher/content/outline \
  -F "file=@tai_lieu.pdf" -F "subject=Tin học" -F "grade=6" \
  -F "level=Basic" -F "quiz_count=3"
```

Lấy `document_id` + `outline` từ response, sửa outline nếu cần, rồi:

```bash
curl -X POST http://127.0.0.1:8000/api/teacher/content/generate \
  -H "Content-Type: application/json" \
  -d '{"document_id":"doc-...","grade":"6","level":"Basic","quiz_count":3,
       "outline":[{"id":"sec-1","title":"...","description":"..."}]}'
```

## Ghi chú an toàn

- Quiz có `correct_answer` không khớp `options` sẽ bị loại ở server (không để lọt câu hỏi chấm sai).
- Nội dung AI sinh ra là **bản nháp cho giáo viên duyệt** — service này không tự publish tới học sinh, giữ đúng nguyên tắc "AI never reaches students unreviewed" của EduOne.
