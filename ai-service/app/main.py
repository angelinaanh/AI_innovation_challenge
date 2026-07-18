"""AI Content Service — FastAPI app entry.

Chạy dev:  uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.content import router as content_router

app = FastAPI(
    title="EduOne AI Content Service",
    description="Tạo bài giảng bằng AI theo luồng Human-in-the-Loop: outline -> giáo viên duyệt -> bài giảng + quiz.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
