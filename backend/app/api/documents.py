from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi import Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.db.models import Document, DocumentSource, DocumentStatus
from pydantic import BaseModel
from typing import Optional, List
import uuid, os, shutil
from datetime import datetime, timezone

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class DocumentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    file_type: Optional[str]
    source: str
    status: str
    confidence_score: Optional[float]
    tags: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Загрузка файла в библиотеку
@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    db: AsyncSession = Depends(get_db)
):
    allowed_types = ["application/pdf",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Поддерживаются только PDF, DOCX, TXT")

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        title=title,
        description=description,
        file_path=file_path,
        file_type=ext.replace(".", ""),
        source=DocumentSource.MANUAL,
        status=DocumentStatus.PENDING,
        tags=tags
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return DocumentResponse(
        id=str(doc.id),
        title=doc.title,
        description=doc.description,
        file_type=doc.file_type,
        source=doc.source.value,
        status=doc.status.value,
        confidence_score=doc.confidence_score,
        tags=doc.tags,
        created_at=doc.created_at
    )


# Получить список всех документов
@router.get("/", response_model=List[DocumentResponse])
async def get_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    docs = result.scalars().all()
    return [
        DocumentResponse(
            id=str(d.id),
            title=d.title,
            description=d.description,
            file_type=d.file_type,
            source=d.source.value,
            status=d.status.value,
            confidence_score=d.confidence_score,
            tags=d.tags,
            created_at=d.created_at
        ) for d in docs
    ]


# Удалить документ
@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == uuid.UUID(doc_id)))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Документ не найден")
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    await db.delete(doc)
    await db.commit()
    return {"status": "deleted"}
