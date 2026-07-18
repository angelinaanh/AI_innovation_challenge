"""Phần 1 — Data Schemas (Pydantic v2).

Luồng Human-in-the-Loop:
  1. OutlineRequest  -> OutlineResponse   (AI đề xuất dàn ý)
  2. Giáo viên sửa/chốt dàn ý trên UI
  3. ContentGenerateRequest -> ContentGenerateResponse (AI viết bài + quiz)
"""
from enum import Enum
from typing import List

from pydantic import BaseModel, Field, field_validator


class Level(str, Enum):
    BASIC = "Basic"
    ADVANCED = "Advanced"


# ---------------------------------------------------------------- Outline ----
# Lưu ý: OutlineRequest đi kèm UploadFile nên endpoint nhận multipart/form-data
# (file + form fields), không phải JSON body — xem routers/content.py.
class OutlineItem(BaseModel):
    id: str = Field(..., description="ID ổn định của mục dàn ý, vd 'sec-1'")
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=1000)


# Cấu trúc phân tầng Chương -> Bài học -> Mục (Course Syllabus).
class OutlineSection(BaseModel):
    section_id: str
    section_title: str = Field(..., min_length=1, max_length=300)
    intent: str = Field("", max_length=1000, description="Ghi chú cho giáo viên: mục này dạy gì")


class OutlineLesson(BaseModel):
    lesson_id: str
    lesson_title: str = Field(..., min_length=1, max_length=300)
    estimated_time_minutes: int = Field(5, ge=5, description="Thời lượng lý thuyết, tối thiểu 5 phút")
    sections: List[OutlineSection] = Field(default_factory=list)

    @field_validator("estimated_time_minutes", mode="before")
    @classmethod
    def clamp_minimum_time(cls, value) -> int:
        try:
            return max(5, int(value))
        except (TypeError, ValueError):
            return 5


class OutlineChapter(BaseModel):
    chapter_id: str
    chapter_title: str = Field(..., min_length=1, max_length=300)
    chapter_objective: str = Field("", max_length=1000)
    lessons: List[OutlineLesson] = Field(default_factory=list)

    @field_validator("chapter_id", mode="before")
    @classmethod
    def coerce_chapter_id(cls, value) -> str:
        return str(value)


class CourseOutline(BaseModel):
    subject: str
    target_grade: str
    overall_objective: str = ""
    chapters: List[OutlineChapter] = Field(default_factory=list)


class OutlineResponse(BaseModel):
    document_id: str = Field(..., description="Namespace của tài liệu trong Vector DB, dùng lại ở bước generate")
    subject: str
    grade: str
    level: Level
    course_outline: CourseOutline
    outline: List[OutlineItem] = Field(
        default_factory=list,
        description="Bản phẳng hoá của course_outline (mỗi section 1 item) — tương thích bước /generate",
    )


# ---------------------------------------------------------------- Content ----
class ContentGenerateRequest(BaseModel):
    outline: List[OutlineItem] = Field(..., min_length=1, description="Dàn ý ĐÃ được giáo viên duyệt/sửa")
    document_id: str = Field(..., description="Trả về từ bước outline — trỏ tới tài liệu đã ingest")
    subject: str = Field("", description="Tên môn học, phục vụ ngữ cảnh prompt")
    grade: str
    level: Level
    quiz_count: int = Field(3, ge=1, le=10, description="Số câu quiz cho MỖI mục dàn ý")

    @field_validator("grade")
    @classmethod
    def grade_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("grade must not be blank")
        return value.strip()


class Quiz(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=2, max_length=6)
    correct_answer: str = Field(..., description="Phải trùng khớp 1 phần tử trong options")
    explanation: str

    @field_validator("correct_answer")
    @classmethod
    def strip_answer(cls, value: str) -> str:
        return value.strip()


class SectionContent(BaseModel):
    outline_id: str
    title: str
    content_markdown: str
    quizzes: List[Quiz]


class ContentGenerateResponse(BaseModel):
    document_id: str
    lesson_markdown: str = Field(..., description="Bài giảng hoàn chỉnh (Markdown) ghép từ mọi section")
    sections: List[SectionContent]
    quizzes: List[Quiz] = Field(..., description="Gộp phẳng toàn bộ quiz của các section")
