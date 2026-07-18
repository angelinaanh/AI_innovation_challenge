"""Phần 4 — API endpoints cho luồng Tạo bài giảng bằng AI (Human-in-the-Loop).

POST /api/teacher/content/outline   file + config -> ingest RAG -> Prompt 1 -> dàn ý
POST /api/teacher/content/generate  dàn ý đã duyệt -> retrieve/mục -> Prompt 2 -> bài giảng + quiz
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ..config import get_settings
from ..llm import flatten_course_outline, generate_lesson, generate_outline
from ..rag import RagPipeline, get_rag_pipeline
from ..schemas import (
    GeneratedLesson,
    LessonGenerateRequest,
    LessonGenerateResponse,
    Level,
    OutlineResponse,
)

router = APIRouter(prefix="/api/teacher/content", tags=["teacher-content"])


@router.post("/outline", response_model=OutlineResponse)
async def create_outline(
    file: UploadFile = File(..., description="Tài liệu nguồn PDF/TXT"),
    subject: str = Form(...),
    grade: str = Form(...),
    level: Level = Form(Level.BASIC),
    quiz_count: int = Form(3, ge=1, le=10),  # nhận từ bước 1, dùng ở bước 2
    rag: RagPipeline = Depends(get_rag_pipeline),
) -> OutlineResponse:
    """Bước 1: Giáo viên upload tài liệu -> hệ thống đề xuất dàn ý.

    Dàn ý CHỈ là đề xuất — giáo viên sửa/chốt trên UI rồi mới gọi /generate.
    """
    settings = get_settings()
    raw = await file.read()
    if len(raw) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Tài liệu vượt quá giới hạn 20MB.",
        )
    if not subject.strip() or not grade.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="subject và grade là bắt buộc.",
        )

    # RAG ingest: parse -> chunk 1000/200 tokens -> embed -> Chroma (namespace mới)
    document_id = rag.ingest(file.filename or "upload", raw)

    # Outline cần cái nhìn toàn cục -> lấy các chunk đầu tài liệu làm context.
    context_chunks = rag.sample_context(document_id)
    course_outline = generate_outline(subject.strip(), grade.strip(), level, quiz_count, context_chunks)

    return OutlineResponse(
        document_id=document_id,
        subject=subject.strip(),
        grade=grade.strip(),
        level=level,
        course_outline=course_outline,
        outline=flatten_course_outline(course_outline),
    )


@router.post("/generate", response_model=LessonGenerateResponse)
async def generate_content(
    payload: LessonGenerateRequest,
    rag: RagPipeline = Depends(get_rag_pipeline),
) -> LessonGenerateResponse:
    """Bước 3: Nhận dàn ý ĐÃ DUYỆT -> viết chi tiết TỪNG BÀI HỌC -> trả cả khóa.

    Sinh theo bài (không theo mục) để một lần gọi LLM nhìn thấy trọn vẹn mạch
    của bài — nhờ đó engage_hook, các mục và phần tổng kết ăn khớp với nhau.
    Các bài chạy SONG SONG (tối đa 4) vì một khóa thường có 6+ bài.
    """
    lessons_with_chapter = [
        (chapter.chapter_title, lesson)
        for chapter in payload.course_outline.chapters
        for lesson in chapter.lessons
        if lesson.sections  # bài bị giáo viên xóa hết mục thì bỏ qua
    ]
    if not lessons_with_chapter:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Dàn ý cần ít nhất một bài học còn mục.",
        )

    semaphore = asyncio.Semaphore(4)

    async def build_lesson(chapter_title: str, lesson) -> GeneratedLesson:
        async with semaphore:
            # Truy hồi theo toàn bộ phạm vi bài học: tên bài + mọi mục con.
            query = " ".join(
                [lesson.lesson_title]
                + [section.section_title for section in lesson.sections]
                + [section.intent for section in lesson.sections if section.intent]
            ).strip()
            context_chunks = await asyncio.to_thread(rag.retrieve, payload.document_id, query)
            return await asyncio.to_thread(
                generate_lesson,
                lesson=lesson,
                chapter_title=chapter_title,
                subject=payload.subject,
                grade=payload.grade,
                level=payload.level,
                quiz_count=payload.quiz_count,
                require_quest=payload.require_quest,
                context_chunks=context_chunks,
            )

    # gather giữ nguyên thứ tự dàn ý; 1 bài lỗi -> fail cả request (rõ ràng với
    # giáo viên thay vì trả khóa học thiếu bài ngầm định).
    lessons = list(await asyncio.gather(
        *(build_lesson(chapter_title, lesson) for chapter_title, lesson in lessons_with_chapter)
    ))
    return LessonGenerateResponse(
        document_id=payload.document_id,
        subject=payload.subject,
        grade=payload.grade,
        level=payload.level,
        lessons=lessons,
    )
