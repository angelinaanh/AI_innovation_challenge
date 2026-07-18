"""Cấu hình tập trung cho AI Content Service.

Đọc từ biến môi trường / file .env — không hardcode API key trong code.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # LLM / Embeddings
    openai_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    # None = dùng mặc định của model. Các model đời mới (gpt-5.x) từ chối
    # temperature khác 1, nên chỉ gửi tham số này khi được đặt tường minh.
    llm_temperature: float | None = None

    # RAG tuning — chunk theo token (tiktoken), không theo ký tự.
    chunk_size_tokens: int = 1000
    chunk_overlap_tokens: int = 200
    retrieval_top_k: int = 4

    # Vector store (ChromaDB persistent local)
    chroma_persist_dir: str = "./chroma_data"

    # Giới hạn upload
    max_upload_bytes: int = 20 * 1024 * 1024  # 20 MB


@lru_cache
def get_settings() -> Settings:
    return Settings()
