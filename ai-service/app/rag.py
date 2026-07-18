"""Phần 2 — RAG Pipeline & Vector Storage (ChromaDB).

Trách nhiệm:
  * parse PDF/TXT -> text
  * split theo TOKEN (chunk_size=1000, overlap=200, đo bằng tiktoken)
  * embed + insert vào ChromaDB, mỗi tài liệu 1 collection riêng (namespace
    = document_id) để dễ dọn dẹp và không lẫn tài liệu giữa các giáo viên
  * retrieval top-k theo similarity cho một query
"""
from __future__ import annotations

import io
import uuid
from typing import List

import chromadb
from fastapi import HTTPException, status
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from .config import get_settings


class RagPipeline:
    """Ingest tài liệu giáo viên upload và truy hồi ngữ cảnh cho LLM."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.openai_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENAI_API_KEY chưa được cấu hình — xem .env.example.",
            )
        self._settings = settings
        self._client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        self._embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )
        # Split theo token thật (tiktoken) — 1000 tokens/chunk, overlap 200 —
        # khớp cửa sổ ngữ cảnh embedding và giữ liền mạch ý giữa 2 chunk kề nhau.
        self._splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=settings.chunk_size_tokens,
            chunk_overlap=settings.chunk_overlap_tokens,
        )

    # ------------------------------------------------------------- parsing --
    @staticmethod
    def parse_document(filename: str, raw: bytes) -> str:
        """PDF/TXT -> plain text. Từ chối định dạng khác."""
        name = (filename or "").lower()
        if name.endswith(".pdf"):
            try:
                reader = PdfReader(io.BytesIO(raw))
                text = "\n\n".join((page.extract_text() or "") for page in reader.pages)
            except Exception as error:  # pypdf ném nhiều loại lỗi khác nhau
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Không đọc được file PDF: {error}",
                ) from error
        elif name.endswith(".txt") or name.endswith(".md"):
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                text = raw.decode("utf-8", errors="replace")
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Chỉ hỗ trợ PDF hoặc TXT.",
            )
        text = text.strip()
        if not text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tài liệu không có nội dung văn bản trích xuất được.",
            )
        return text

    # -------------------------------------------------------------- ingest --
    def ingest(self, filename: str, raw: bytes) -> str:
        """Parse + split + embed + insert. Trả về document_id (namespace)."""
        text = self.parse_document(filename, raw)
        chunks = self._splitter.split_text(text)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tài liệu quá ngắn để tạo dàn ý.",
            )

        document_id = f"doc-{uuid.uuid4().hex}"
        vectors = self._embeddings.embed_documents(chunks)
        collection = self._client.create_collection(
            name=document_id,
            metadata={"source": filename, "hnsw:space": "cosine"},
        )
        collection.add(
            ids=[f"{document_id}-{i}" for i in range(len(chunks))],
            documents=chunks,
            embeddings=vectors,
            metadatas=[{"chunk_index": i, "source": filename} for i in range(len(chunks))],
        )
        return document_id

    # ----------------------------------------------------------- retrieval --
    def retrieve(self, document_id: str, query: str, k: int | None = None) -> List[str]:
        """Top-k chunks (mặc định k=4) gần nhất với query trong namespace này."""
        k = k or self._settings.retrieval_top_k
        try:
            collection = self._client.get_collection(name=document_id)
        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"document_id không tồn tại hoặc đã hết hạn: {document_id}",
            ) from error
        query_vector = self._embeddings.embed_query(query)
        result = collection.query(
            query_embeddings=[query_vector],
            n_results=min(k, max(collection.count(), 1)),
        )
        documents = result.get("documents") or [[]]
        return documents[0]

    def sample_context(self, document_id: str, max_chunks: int = 6) -> List[str]:
        """Lấy các chunk đầu tài liệu (theo thứ tự gốc) làm 'tóm tắt' đầu vào
        cho bước sinh dàn ý — outline cần cái nhìn toàn cục, không cần query."""
        try:
            collection = self._client.get_collection(name=document_id)
        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"document_id không tồn tại: {document_id}",
            ) from error
        result = collection.get(include=["documents", "metadatas"])
        rows = sorted(
            zip(result.get("documents") or [], result.get("metadatas") or []),
            key=lambda row: row[1].get("chunk_index", 0),
        )
        return [document for document, _ in rows[:max_chunks]]

    def delete(self, document_id: str) -> None:
        """Dọn namespace tạm sau khi giáo viên hoàn tất/hủy phiên soạn bài."""
        try:
            self._client.delete_collection(name=document_id)
        except Exception:
            pass  # đã xoá hoặc không tồn tại — bỏ qua


_pipeline: RagPipeline | None = None


def get_rag_pipeline() -> RagPipeline:
    """FastAPI dependency — singleton, tránh mở lại Chroma client mỗi request."""
    global _pipeline
    if _pipeline is None:
        _pipeline = RagPipeline()
    return _pipeline
