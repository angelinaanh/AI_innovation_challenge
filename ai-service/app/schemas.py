"""Phần 1 — Data Schemas (Pydantic v2).

Luồng Human-in-the-Loop:
  1. OutlineRequest -> OutlineResponse  (AI đề xuất dàn ý)
  2. Giáo viên sửa/chốt dàn ý trên UI
  3. LessonGenerateRequest -> LessonGenerateResponse  (AI viết bài giảng chi
     tiết theo từng bài học, giáo viên sửa rồi lưu vào DB qua backend Node)
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


# ------------------------------------------------------- Bài giảng chi tiết ---
# Cấu trúc theo ai/prompts/create_leacturer.md — sinh theo TỪNG BÀI HỌC (không
# phải từng mục): engage hook, block đa dạng, quiz có feedback cho từng phương
# án, và nhiệm vụ thực hành cuối bài.
class BlockType(str, Enum):
    TEXT = "text"
    FORMULA = "formula"
    IMAGE_SUGGESTION = "image_suggestion"
    QUICK_PRACTICE = "quick_practice"
    TIP = "tip"


class ContentBlock(BaseModel):
    """Block đa hình. Mỗi type dùng một tập field khác nhau nên tất cả đều
    optional; validator dưới đây loại block thiếu field bắt buộc của chính nó."""
    type: BlockType
    content: str = ""
    alt_text: str = ""          # image_suggestion
    question: str = ""          # quick_practice
    answer: str = ""            # quick_practice

    def is_valid(self) -> bool:
        if self.type is BlockType.IMAGE_SUGGESTION:
            return bool(self.alt_text.strip())
        if self.type is BlockType.QUICK_PRACTICE:
            return bool(self.question.strip() and self.answer.strip())
        return bool(self.content.strip())


class LessonSection(BaseModel):
    section_id: str
    section_title: str
    content_blocks: List[ContentBlock] = Field(default_factory=list)


class QuizOption(BaseModel):
    text: str
    is_correct: bool = False
    feedback: str = ""


class LessonQuiz(BaseModel):
    question: str
    options: List[QuizOption] = Field(..., min_length=2, max_length=6)

    @field_validator("options")
    @classmethod
    def exactly_one_correct(cls, value: List[QuizOption]) -> List[QuizOption]:
        if sum(1 for option in value if option.is_correct) != 1:
            raise ValueError("mỗi câu hỏi phải có đúng 1 đáp án đúng")
        return value


class Evaluation(BaseModel):
    quizzes: List[LessonQuiz] = Field(default_factory=list)


class PracticalQuest(BaseModel):
    quest_title: str
    scenario: str = ""
    task: str = ""
    deliverable: str = ""


class GeneratedLesson(BaseModel):
    lesson_id: str
    lesson_title: str
    chapter_title: str = Field("", description="Bối cảnh chương, backend gán lại từ dàn ý")
    estimated_time_minutes: int = Field(5, ge=5)
    engage_hook: str = ""
    sections: List[LessonSection] = Field(default_factory=list)
    lesson_highlights: List[str] = Field(default_factory=list)
    evaluation: Evaluation = Field(default_factory=Evaluation)
    practical_quest: PracticalQuest | None = None


class LessonGenerateRequest(BaseModel):
    """Dàn ý ĐÃ được giáo viên duyệt ở bước 2 — gửi nguyên cây Chương/Bài/Mục."""
    course_outline: CourseOutline
    document_id: str
    subject: str = ""
    grade: str
    level: Level
    quiz_count: int = Field(3, ge=1, le=10, description="Số câu quiz cho MỖI bài học")
    require_quest: bool = Field(True, description="Sinh nhiệm vụ thực hành cuối mỗi bài")

    @field_validator("grade")
    @classmethod
    def grade_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("grade must not be blank")
        return value.strip()


class LessonGenerateResponse(BaseModel):
    document_id: str
    subject: str
    grade: str
    level: Level
    lessons: List[GeneratedLesson]
