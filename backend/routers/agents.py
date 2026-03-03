from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import logging
from datetime import datetime

from agents.design_agent import generate_tz, validate_tz
from db import get_db
from models import TZSpec, TZSection

router = APIRouter(prefix="/api/agents", tags=["agents"])
logger = logging.getLogger(__name__)

class DesignRequest(BaseModel):
    prompt: str

class DesignResponse(BaseModel):
    id: int
    title: str
    version: str
    status: str
    created_at: datetime

class ValidateRequest(BaseModel):
    tz_content: str

class ValidateResponse(BaseModel):
    analysis: str

class SectionSchema(BaseModel):
    id: int
    title: str
    content: str
    order_index: int

class TZDetailResponse(BaseModel):
    id: int
    title: str
    version: str
    status: str
    created_at: datetime
    sections: List[SectionSchema]

@router.post("/design", response_model=DesignResponse)
async def create_tz(request: DesignRequest, db: Session = Depends(get_db)):
    try:
        tz_text = generate_tz(request.prompt)

        # Простейший парсинг разделов
        lines = tz_text.split('\n')
        sections = []
        current_title = "Введение"
        current_content = []
        order = 0

        for line in lines:
            if line.startswith('#') or (line and line[0].isdigit() and '. ' in line[:5]):
                if current_content:
                    sections.append({
                        "title": current_title,
                        "content": '\n'.join(current_content).strip(),
                        "order": order
                    })
                    order += 1
                current_title = line.strip('# ')
                current_content = []
            else:
                current_content.append(line)
        if current_content:
            sections.append({
                "title": current_title,
                "content": '\n'.join(current_content).strip(),
                "order": order
            })

        tz_spec = TZSpec(
            title=request.prompt[:100],
            version="1.0",
            status="draft"
        )
        db.add(tz_spec)
        db.flush()

        for sec in sections:
            section = TZSection(
                spec_id=tz_spec.id,
                title=sec["title"],
                content=sec["content"],
                order_index=sec["order"]
            )
            db.add(section)

        db.commit()
        db.refresh(tz_spec)

        return DesignResponse(
            id=tz_spec.id,
            title=tz_spec.title,
            version=tz_spec.version,
            status=tz_spec.status,
            created_at=tz_spec.created_at
        )
    except Exception as e:
        db.rollback()
        logger.exception("Ошибка в /design")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tz", response_model=List[DesignResponse])
async def list_tz(db: Session = Depends(get_db)):
    try:
        specs = db.query(TZSpec).order_by(TZSpec.created_at.desc()).all()
        return specs
    except Exception as e:
        logger.exception("Ошибка получения списка ТЗ")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tz/{tz_id}", response_model=TZDetailResponse)
async def get_tz(tz_id: int, db: Session = Depends(get_db)):
    try:
        spec = db.query(TZSpec).filter(TZSpec.id == tz_id).first()
        if not spec:
            raise HTTPException(status_code=404, detail="ТЗ не найдено")
        sections = db.query(TZSection).filter(TZSection.spec_id == tz_id).order_by(TZSection.order_index).all()
        return TZDetailResponse(
            id=spec.id,
            title=spec.title,
            version=spec.version,
            status=spec.status,
            created_at=spec.created_at,
            sections=sections
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Ошибка получения ТЗ")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate", response_model=ValidateResponse)
async def validate_tz_endpoint(request: ValidateRequest):
    try:
        analysis = validate_tz(request.tz_content)
        return ValidateResponse(analysis=analysis)
    except Exception as e:
        logger.exception("Ошибка в /validate")
        raise HTTPException(status_code=500, detail=str(e))
