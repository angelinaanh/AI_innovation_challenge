"""Gọi LLM cho 2 bước của luồng HITL và parse JSON output an toàn."""
from __future__ import annotations

import json
import re
from typing import List

from fastapi import HTTPException, status
from langchain_openai import ChatOpenAI

from .config import get_settings
from .prompts import CONTENT_PROMPT, OUTLINE_PROMPT
from .schemas import CourseOutline, Level, OutlineItem, Quiz


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
def generate_section(
    item: OutlineItem,
    grade: str,
    level: Level,
    quiz_count: int,
    context_chunks: List[str],
) -> tuple[str, List[Quiz]]:
    """Trả về (content_markdown, quizzes) cho MỘT mục dàn ý."""
    llm = _build_llm()
    messages = CONTENT_PROMPT.format_messages(
        grade=grade,
        level=level.value,
        outline_title=item.title,
        outline_description=item.description or "(không có mô tả)",
        quiz_count=quiz_count,
        context="\n\n---\n\n".join(context_chunks) if context_chunks else "(không tìm thấy đoạn liên quan)",
    )
    data = _parse_json(llm.invoke(messages).content, f"viết mục '{item.title}'")

    content = str(data.get("content") or "").strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM không trả về nội dung cho mục '{item.title}'.",
        )

    quizzes: List[Quiz] = []
    for quiz_raw in data.get("quizzes") or []:
        try:
            quiz = Quiz.model_validate(quiz_raw)
        except Exception:
            continue  # bỏ câu hỏng cấu trúc thay vì fail cả mục
        if quiz.correct_answer not in quiz.options:
            continue  # đáp án không khớp options -> loại (an toàn chấm điểm)
        quizzes.append(quiz)
    return content, quizzes
