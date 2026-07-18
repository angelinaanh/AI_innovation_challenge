"""Gọi LLM cho 2 bước của luồng HITL và parse JSON output an toàn."""
from __future__ import annotations

import json
import re
from typing import List

from fastapi import HTTPException, status
from langchain_openai import ChatOpenAI

from .config import get_settings
from .prompts import LESSON_PROMPT, OUTLINE_PROMPT
from .schemas import (
    BlockType,
    ContentBlock,
    CourseOutline,
    GeneratedLesson,
    LessonQuiz,
    Level,
    OutlineItem,
    OutlineLesson,
)


def _build_llm() -> ChatOpenAI:
    settings = get_settings()
    kwargs = {
        "model": settings.llm_model,
        "api_key": settings.openai_api_key,
        # Ép model trả JSON object hợp lệ — cùng ràng buộc đã ghi trong prompt.
        "model_kwargs": {"response_format": {"type": "json_object"}},
    }
    # gpt-5.x chỉ chấp nhận temperature mặc định — chỉ gửi khi đặt tường minh.
    if settings.llm_temperature is not None:
        kwargs["temperature"] = settings.llm_temperature
    return ChatOpenAI(**kwargs)


def _parse_json(raw: str, step: str) -> dict:
    """Parse output LLM; chịu được trường hợp model vẫn bọc ```json ...```."""
    text = raw.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, flags=re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM trả về JSON không hợp lệ ở bước {step}.",
        ) from error
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM trả về cấu trúc không đúng ở bước {step}.",
        )
    return data


# ---------------------------------------------------------------- Outline ---
LEVEL_LABELS = {Level.BASIC: "Cơ bản", Level.ADVANCED: "Nâng cao"}


def flatten_course_outline(course: CourseOutline) -> List[OutlineItem]:
    """Mỗi section -> 1 OutlineItem phẳng, giữ ngữ cảnh bài học trong title —
    bước /generate hiện có tiếp tục hoạt động không đổi trên danh sách này."""
    items: List[OutlineItem] = []
    for chapter in course.chapters:
        for lesson in chapter.lessons:
            for section in lesson.sections:
                items.append(OutlineItem(
                    id=section.section_id,
                    title=f"{lesson.lesson_title} — {section.section_title}",
                    description=section.intent,
                ))
    return items


def generate_outline(
    subject: str,
    grade: str,
    level: Level,
    quiz_count: int,
    context_chunks: List[str],
) -> CourseOutline:
    llm = _build_llm()
    messages = OUTLINE_PROMPT.format_messages(
        subject=subject,
        grade=grade,
        level_label=LEVEL_LABELS[level],
        quiz_count=quiz_count,
        context="\n\n---\n\n".join(context_chunks),
    )
    data = _parse_json(llm.invoke(messages).content, "tạo dàn ý")
    raw_course = data.get("course_outline")
    if not isinstance(raw_course, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM không trả về course_outline.",
        )
    raw_course.setdefault("subject", subject)
    raw_course.setdefault("target_grade", grade)
    try:
        course = CourseOutline.model_validate(raw_course)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Dàn ý LLM trả về sai cấu trúc phân tầng.",
        ) from error
    if not course.chapters or not any(lesson.sections for chapter in course.chapters for lesson in chapter.lessons):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Dàn ý trả về rỗng — tài liệu có thể quá ngắn.",
        )
    return course


# ---------------------------------------------------------------- Content ---
_HTML_TAG_RE = re.compile(r"<(h[1-6]|p|div|strong|b|em|i|ul|ol|li|br)\b[^>]*>", re.IGNORECASE)


def _normalize_markdown(text: str) -> str:
    """Fallback khi model lỡ trả HTML thay vì Markdown — UI chỉ render Markdown."""
    if not _HTML_TAG_RE.search(text):
        return text
    out = text
    for pattern, repl in (
        (r"<br\s*/?>", "\n"),
        (r"</(p|div|h[1-6]|ul|ol)>", "\n\n"),
        (r"<h[1-6][^>]*>", "\n### "),
        (r"</?(strong|b)>", "**"),
        (r"</?(em|i)>", "*"),
        (r"<li[^>]*>", "- "),
        (r"</li>", "\n"),
        (r"<[^>]+>", ""),  # thẻ còn sót lại
    ):
        out = re.sub(pattern, repl, out, flags=re.IGNORECASE)
    return re.sub(r"\n{3,}", "\n\n", out).strip()


# ----------------------------------------------------- Bài giảng chi tiết ---
def _normalize_blocks(section: dict) -> None:
    """Loại block thiếu field bắt buộc và chuẩn hoá Markdown trong từng block.

    Model thỉnh thoảng trả block rỗng hoặc sai type; bỏ block hỏng tốt hơn là
    fail cả bài học, vì giáo viên vẫn sửa được ở bước sau.
    """
    kept = []
    for raw in section.get("content_blocks") or []:
        try:
            block = ContentBlock.model_validate(raw)
        except Exception:
            continue
        if not block.is_valid():
            continue
        # Công thức LaTeX giữ nguyên; các trường văn bản khác lọc HTML.
        if block.type is not BlockType.FORMULA:
            block.content = _normalize_markdown(block.content)
            block.answer = _normalize_markdown(block.answer)
            block.question = _normalize_markdown(block.question)
        kept.append(block.model_dump())
    section["content_blocks"] = kept


def generate_lesson(
    lesson: OutlineLesson,
    chapter_title: str,
    subject: str,
    grade: str,
    level: Level,
    quiz_count: int,
    require_quest: bool,
    context_chunks: List[str],
) -> GeneratedLesson:
    """Viết chi tiết MỘT bài học từ dàn ý đã được giáo viên duyệt."""
    llm = _build_llm()
    lesson_outline_json = json.dumps(
        {
            "lesson_id": lesson.lesson_id,
            "lesson_title": lesson.lesson_title,
            "estimated_time_minutes": lesson.estimated_time_minutes,
            "sections": [
                {
                    "section_id": section.section_id,
                    "section_title": section.section_title,
                    "intent": section.intent,
                }
                for section in lesson.sections
            ],
        },
        ensure_ascii=False,
        indent=2,
    )
    messages = LESSON_PROMPT.format_messages(
        subject=subject or "(không nêu)",
        chapter_title=chapter_title or "(không nêu)",
        grade=grade,
        level_label=LEVEL_LABELS[level],
        estimated_minutes=lesson.estimated_time_minutes,
        quiz_count=quiz_count,
        require_quest="TRUE" if require_quest else "FALSE",
        lesson_outline_json=lesson_outline_json,
        context="\n\n---\n\n".join(context_chunks) if context_chunks else "(không tìm thấy đoạn liên quan)",
    )
    data = _parse_json(llm.invoke(messages).content, f"viết bài '{lesson.lesson_title}'")

    # Neo lại danh tính bài học theo dàn ý giáo viên đã duyệt — không để model
    # tự đổi id/tên, nếu không frontend sẽ không map được về đúng bài.
    data["lesson_id"] = lesson.lesson_id
    data.setdefault("lesson_title", lesson.lesson_title)
    data["chapter_title"] = chapter_title
    data["estimated_time_minutes"] = lesson.estimated_time_minutes
    data["engage_hook"] = _normalize_markdown(str(data.get("engage_hook") or ""))
    data["lesson_highlights"] = [
        _normalize_markdown(str(item)) for item in (data.get("lesson_highlights") or []) if str(item).strip()
    ]
    # Mục "Kiểm tra & Đánh giá" trong dàn ý không có block nào — phần đánh giá
    # nằm ở evaluation.quizzes. Bỏ các mục rỗng để editor không hiện khung trống
    # và backend không từ chối khi lưu.
    sections = []
    for section in data.get("sections") or []:
        if not isinstance(section, dict):
            continue
        _normalize_blocks(section)
        if section["content_blocks"]:
            sections.append(section)
    data["sections"] = sections

    # Quiz sai cấu trúc (0 hoặc >1 đáp án đúng) bị loại từng câu, thay vì làm
    # hỏng cả bài — giáo viên có thể tự bổ sung ở bước chỉnh sửa.
    raw_quizzes = ((data.get("evaluation") or {}).get("quizzes")) or []
    valid_quizzes = []
    for raw in raw_quizzes:
        try:
            valid_quizzes.append(LessonQuiz.model_validate(raw).model_dump())
        except Exception:
            continue
    data["evaluation"] = {"quizzes": valid_quizzes}

    if not require_quest:
        data["practical_quest"] = None

    try:
        return GeneratedLesson.model_validate(data)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bài giảng LLM trả về sai cấu trúc ở bài '{lesson.lesson_title}'.",
        ) from error
