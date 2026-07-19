# System Audit — Bug & Tech-Debt Tracker

> Rà soát frontend + backend ngày **2026-07-19**. Mục tiêu: liệt kê các vấn đề nghiêm trọng, tính năng thừa, và rủi ro tương lai để sửa dần.
> Đường dẫn file tính từ gốc repo `AI_innovation_challenge/`. Đánh dấu `[x]` khi đã sửa.
>
> **Cập nhật 2026-07-19:** đã fix #2, #3, #4, #7 (rủi ro thấp – giá trị cao). Các mục cần refactor lớn / dễ gãy tính năng đang chạy tốt (#5, #6, #8, #9, #10, #11, #12, #14, #15) được **tạm hoãn có chủ đích** — xem ghi chú `⏸️` ở từng mục. #1 là thao tác thủ công (thu hồi key), không sửa bằng code.

## Mức độ

| Ký hiệu | Ý nghĩa |
|---|---|
| 🔴 | Nghiêm trọng — bảo mật / chi phí / chặn production |
| 🟠 | Sai lầm kiến trúc — ảnh hưởng khi scale/production |
| 🟡 | Tính năng thừa / trùng lặp (nợ kỹ thuật) |
| ⚪ | Chất lượng / kỹ thuật |

## Tổng quan

| # | Mức | Vấn đề | Trạng thái |
|---|-----|--------|------------|
| 1 | 🔴 | Khóa OpenAI bị lộ trong hội thoại | ⚠️ Thủ công (thu hồi key) |
| 2 | 🔴 | Sinh nội dung AI bỏ qua budget guard & usage tracking | [x] Đã sửa |
| 3 | 🔴 | Không có rate limiting | [x] Đã sửa |
| 4 | 🔴 | Giới hạn body 25MB áp cho toàn bộ API | [x] Đã sửa |
| 5 | 🟠 | Kho tài liệu lưu trong RAM (không multi-instance) | ⏸️ Tạm hoãn |
| 6 | 🟠 | Sinh bài giảng là request đồng bộ dài (tới 180s) | ⏸️ Tạm hoãn |
| 7 | 🟠 | `studentGrade = 9` hard-code | [x] Đã sửa |
| 8 | 🟠 | Ảnh nhúng base64 vào jsonb | ⏸️ Tạm hoãn |
| 9 | 🟡 | Python `ai-service/` là code chết | ⏸️ Tạm hoãn |
| 10 | 🟡 | Dữ liệu syllabus nhân đôi FE/BE | ⏸️ Tạm hoãn |
| 11 | 🟡 | `softSkillLessons.js` 735 dòng hard-code trong bundle | ⏸️ Tạm hoãn |
| 12 | 🟡 | Prompt tồn tại 2 bản (file .md + inline) | ⏸️ Tạm hoãn |
| 13 | ⚪ | Không có test cho code mới chạm DB | ⏸️ Tạm hoãn |
| 14 | ⚪ | Bundle frontend > 500KB, không code-splitting | ⏸️ Tạm hoãn |
| 15 | ⚪ | RLS chưa hoàn chỉnh | ⏸️ Tạm hoãn |

---

## 🔴 Nghiêm trọng

### [ ] 1. Khóa OpenAI bị lộ
- **Chỗ:** `backend/.env` (`OPENAI_API_KEY`). File được gitignore nên **không lọt lên Git** ✅, nhưng key đã bị dán vào hội thoại nhiều lần → nằm trong log.
- **Ảnh hưởng:** Bất kỳ ai đọc được log đều dùng được key để tiêu tiền tài khoản OpenAI.
- **Sửa:** Thu hồi key hiện tại trên platform.openai.com, tạo key mới, cập nhật `.env`. Không bao giờ dán key vào chat/PR/issue.

### [x] 2. Sinh nội dung AI bỏ qua budget guard & usage tracking — ĐÃ SỬA
- **Chỗ:** `backend/services/content-studio/aiContentGenerator.js`.
- **Ảnh hưởng:** 1 giáo viên tạo khóa 40+ bài = 40+ lần gọi OpenAI, không trần chi phí → cháy tiền, mù chi phí.
- **✅ Đã sửa (2026-07-19):**
  - Thêm `guardBudget(orgId)` gọi `assertAiBudgetAllowance` ở đầu `generateOutline` và `generateCourseLessons` → chặn `AI_BUDGET_EXCEEDED` khi hết ngân sách ngày. Fail-open trên lỗi hạ tầng để không gãy luồng đang chạy.
  - Thêm `trackUsage()` (best-effort) trong `callJson` → gọi `recordAiUsage()` sau mỗi lần gọi OpenAI, cập nhật `daily_cost_budgets` + `ai_usage` (feature `content_outline` / `content_lesson`).
  - `orgId`/`userId` truyền từ `contentStudioController` (`request.auth.profile.org_id`/`id`).
  - **Sửa kèm ở `aiGateway.js`:** thêm giá cho model `gpt-5.6` (model thực trong `.env`) vào `MODEL_PRICING_PER_MILLION`. Trước đó thiếu → `estimateCost` = 0 → ngân sách không tăng cho CẢ Tutor lẫn content. Nay cost tính đúng.
- **Lưu ý vận hành:** ngân sách mặc định `AI_DAILY_BUDGET_USD=5`. Một khóa lớn (40+ bài) có thể chạm trần → khi demo cần nhiều, tăng biến này trong `backend/.env`.

### [x] 3. Không có rate limiting — ĐÃ SỬA
- **Ảnh hưởng:** Endpoint AI đắt bị gọi dồn → cạn ngân sách/CPU.
- **✅ Đã sửa (2026-07-19):**
  - Thêm dependency `express-rate-limit`.
  - Tạo `backend/middleware/rateLimit.js` → `aiContentRateLimiter` (6 req/phút/user, khoá theo `profile.id`, trả 429 `RATE_LIMITED` đúng envelope lỗi).
  - Gắn vào `POST /content/outline` và `POST /content/generate` trong `teacherRoutes.js`.
- **Mở rộng sau (nếu cần):** áp thêm cho tutor stream / placement generate.

### [x] 4. Giới hạn body 25MB áp cho toàn bộ API — ĐÃ SỬA
- **Ảnh hưởng:** Mọi endpoint nhận payload tới 25MB → bề mặt DoS / ngốn RAM.
- **✅ Đã sửa (2026-07-19):** trong `backend/app.js`, parser 25MB chỉ áp cho `POST /api/teacher/content/ai-courses` và `PATCH /api/teacher/ai-lessons/:id` (chạy trước, đặt `req._body`); toàn bộ API còn lại giữ **1MB**.
  - Kèm sửa `errorHandler.js` để tôn trọng `error.status`/`statusCode` → payload quá lớn nay trả **413** (kèm thông báo tiếng Việt) thay vì 500.
  - **Đã kiểm thử:** 2MB → route thường trả `413`; 2MB → route lưu bài giảng được chấp nhận (qua parser, tới lớp auth). Lý tưởng dài hạn: bỏ base64 (xem #8) rồi hạ hẳn limit.

---

## 🟠 Sai lầm kiến trúc

### [ ] 5. Kho tài liệu lưu trong RAM
- **Chỗ:** `backend/services/content-studio/aiContentGenerator.js` — `const documentStore = new Map()`.
- **Ảnh hưởng:** Text tài liệu giữ giữa bước outline→generate trong bộ nhớ process → **vỡ khi chạy nhiều instance** (load balancer) hoặc backend restart giữa 2 bước ("Tài liệu đã hết hạn").
- **Sửa:** Lưu text tạm vào Redis (TTL) hoặc một bảng tạm trong Postgres, key theo `document_id`.

### [ ] 6. Sinh bài giảng là request đồng bộ dài (tới 180s)
- **Chỗ:** `aiContentGenerator.js` (`timeoutMs` 120–180s, sinh nhiều bài song song) + controller `postContentGenerate`.
- **Ảnh hưởng:** Sau reverse proxy/serverless (timeout mặc định 30–60s) sẽ **504** với khóa lớn; UX treo lâu.
- **Sửa:** Chuyển sang tác vụ nền (job queue) + trả `jobId`, frontend polling hoặc nhận qua websocket/realtime đã có.

### [x] 7. `studentGrade = 9` hard-code — ĐÃ SỬA
- **Ảnh hưởng:** Mọi học sinh đều thấy Lớp 9 bất kể hồ sơ → blocker production.
- **✅ Đã sửa (2026-07-19):** đổi thành `Number(dashboard?.student?.gradeLevel) || 9` trong `LearningPathPage.jsx` — dùng lớp thật của học sinh, chỉ mặc định 9 khi hồ sơ chưa gán lớp (demo vẫn chạy). Build FE OK.

### [ ] 8. Ảnh nhúng base64 vào `lessons.content` jsonb
- **Chỗ:** `frontend/.../GeneratedLessonEditor.jsx` (khối `image`, đọc file → data URI); validate `backend/services/content-studio/aiLessonRules.js`.
- **Ảnh hưởng:** Ảnh (~1.3× kích thước gốc) nằm thẳng trong DB row → phình DB, kéo theo body 25MB (#4), không CDN/cache.
- **Sửa:** Upload ảnh lên Supabase Storage, chỉ lưu URL trong `content`.

---

## 🟡 Tính năng thừa / trùng lặp

### [ ] 9. Python `ai-service/` là code chết
- **Chỗ:** `ai-service/` (FastAPI + Chroma), `ai-service/app/routers/content.py`.
- **Bằng chứng:** Frontend không còn tham chiếu cổng 8000 (đã chuyển sinh bài giảng sang Node).
- **Ảnh hưởng:** Gánh nặng bảo trì + trùng logic prompt.
- **Sửa:** Gỡ bỏ service, hoặc ghi rõ vai trò còn lại (nếu định dùng cho RAG thật sau này).

### [ ] 10. Dữ liệu syllabus nhân đôi
- **Chỗ:** `backend/services/learning/syllabusData.js` (đầy đủ) vs `frontend/src/features/learning-path/grade9Syllabus.js` (chỉ Toán đầy đủ, dùng làm fallback).
- **Ảnh hưởng:** Hai nguồn sự thật, dễ lệch; fallback frontend không nhất quán.
- **Sửa:** Giữ backend/DB là nguồn duy nhất; rút gọn hoặc bỏ hẳn file frontend, để lỗi API hiện thông báo thay vì fallback nội dung cũ.

### [ ] 11. `softSkillLessons.js` 735 dòng hard-code trong bundle
- **Chỗ:** `frontend/src/features/student-content/softSkillLessons.js`.
- **Ảnh hưởng:** Hệ thống nội dung học song song, tách rời `learning_paths` DB; phình bundle; trùng ý tưởng với lộ trình học.
- **Sửa:** Đưa dữ liệu vào cùng cơ chế DB (learning_paths hoặc bảng riêng) và tải qua API.

### [ ] 12. Prompt tồn tại 2 bản
- **Chỗ:** `ai/prompts/create_syllsbus.md`, `ai/prompts/create_leacturer.md` vs chuỗi inline trong `aiContentGenerator.js`.
- **Ảnh hưởng:** Sửa prompt phải đồng bộ 2 nơi, dễ quên.
- **Sửa:** Đọc prompt từ file .md lúc khởi động (một nguồn), hoặc bỏ file .md nếu chỉ để tham khảo.

---

## ⚪ Chất lượng / kỹ thuật

### [ ] 13. Không có test cho code mới chạm DB
- **Chỗ:** `backend/tests/` chỉ có `*Rules.test.js` (logic thuần) + `pathEngine`.
- **Thiếu:** learning-path service, aiContentGenerator, content-studio service (đều chạm DB/AI).
- **Sửa:** Thêm test (mock supabase/openai) cho các nhánh chính: fallback khi thiếu bảng, hợp nhất tiến độ, chuẩn hóa lesson/quiz, xử lý JSON cắt ngang.

### [ ] 14. Bundle frontend > 500KB, không code-splitting
- **Chỗ:** cảnh báo khi `npm run build`; nặng thêm do #10, #11.
- **Sửa:** `React.lazy` + route-based code splitting; tách dữ liệu tĩnh lớn ra khỏi bundle (tải qua API).

### [ ] 15. RLS chưa hoàn chỉnh
- **Chỗ:** `database/README.md` ghi "RLS phải siết trước pilot"; hệ thống dựa vào service-role ở backend.
- **Ảnh hưởng:** Khoảng trống bảo mật nếu sau này có client truy cập DB trực tiếp.
- **Sửa:** Rà soát & bổ sung policy RLS cho mọi bảng nhạy cảm; kiểm thử bằng token client thật.

---

## ⏸️ Các mục tạm hoãn có chủ đích (lý do)

Theo nguyên tắc "không sửa nếu rủi ro cao làm gãy tính năng đang chạy tốt / phải refactor lớn":

- **#5 (RAM store), #6 (job queue), #8 (ảnh lên Storage):** cần hạ tầng mới (Redis / hàng đợi / Storage bucket) + migration + viết lại luồng đang chạy ổn. Rủi ro cao, để lại khi chuẩn bị scale thật.
- **#9 (gỡ `ai-service/`):** xoá cả một service — dù là code chết, nên để chủ dự án quyết định (có thể tái dùng cho RAG). Không xoá vội.
- **#10 (dữ liệu syllabus trùng), #11 (`softSkillLessons`), #12 (prompt 2 bản):** dọn dẹp/di trú dữ liệu lớn; đang hoạt động đúng, sửa vội dễ gãy nội dung hiển thị. Ưu tiên thấp.
- **#13 (test), #14 (code-splitting), #15 (RLS):** cải thiện dài hạn; RLS đặc biệt cần review kỹ từng bảng, sai policy có thể chặn cả backend service-role. Làm ở phiên chuyên trách.

## Thứ tự đề xuất (còn lại)
1. **#1** thu hồi & đổi OpenAI key — thủ công, **làm ngay**.
2. ~~#2, #3, #4, #7~~ — ✅ đã xong.
3. **#9, #10, #11** dọn code chết & dữ liệu trùng — giảm nợ kỹ thuật.
4. **#5, #6, #8** hạ tầng lưu trữ & tác vụ nền — khi chuẩn bị scale.
5. **#13, #14, #15** test, bundle, RLS — cải thiện dài hạn (phiên chuyên trách).
