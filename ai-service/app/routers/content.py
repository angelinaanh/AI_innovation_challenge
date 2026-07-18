"""Phần 4 — API endpoints cho luồng Tạo bài giảng bằng AI (Human-in-the-Loop).

POST /api/teacher/content/outline   file + config -> ingest RAG -> Prompt 1 -> dàn ý
POST /api/teacher/content/generate  dàn ý đã duyệt -> retrieve/mục -> Prompt 2 -> bài giảng + quiz
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from ..config import get_settings
from ..llm import flatten_course_outline, generate_outline, generate_section
from ..rag import RagPipeline, get_rag_pipeline
from ..schemas import (
    ContentGenerateRequest,
    ContentGenerateResponse,
    Level,
    OutlineResponse,
    Quiz,
    SectionContent,
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


@router.post("/generate", response_model=ContentGenerateResponse)
async def generate_content(
    payload: ContentGenerateRequest,
    rag: RagPipeline = Depends(get_rag_pipeline),
) -> ContentGenerateResponse:
    """Bước 2: Nhận dàn ý ĐÃ DUYỆT -> viết từng mục (RAG per-section) -> gom bài.

    Các mục được sinh SONG SONG (tối đa 4 cùng lúc) — dàn ý STEAM thường có
    20+ mục, chạy tuần tự với model lớn mất hàng chục phút.
    """
    semaphore = asyncio.Semaphore(4)

    async def build_section(item) -> SectionContent:
        async with semaphore:
            # Mỗi mục truy hồi top-k=4 chunks riêng theo đúng chủ đề của mục đó.
            query = f"{item.title}. {item.description}".strip()
            context_chunks = await asyncio.to_thread(rag.retrieve, payload.document_id, query)
            content_markdown, quizzes = await asyncio.to_thread(
                generate_section,
                item=item,
                grade=payload.grade,
                level=payload.level,
                quiz_count=payload.quiz_count,
                context_chunks=context_chunks,
            )
        return SectionContent(
            outline_id=item.id,
            title=item.title,
            content_markdown=content_markdown,
            quizzes=quizzes,
        )

    # gather giữ nguyên thứ tự outline; 1 mục lỗi -> fail cả request (rõ ràng
    # với giáo viên thay vì trả bài giảng thiếu mục ngầm định).
    sections = list(await asyncio.gather(*(build_section(item) for item in payload.outline)))
    all_quizzes: list[Quiz] = [quiz for section in sections for quiz in section.quizzes]

    lesson_markdown = "\n\n".join(
        f"## {section.title}\n\n{section.content_markdown}" for section in sections
    )
    return ContentGenerateResponse(
        document_id=payload.document_id,
        lesson_markdown=lesson_markdown,
        sections=sections,
        quizzes=all_quizzes,
    )
