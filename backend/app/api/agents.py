from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.design_agent import DesignAgent
from app.agents.research_agent import ResearchAgent
from app.db.database import get_db
from app.db.models import (
    AgentLog,
    Document,
    DocumentSource,
    DocumentStatus,
    TechnicalSpec,
    TZSection,
)

router = APIRouter(prefix="/api/agents", tags=["Agents"])


class ResearchRequest(BaseModel):
    query: str
    max_results: int = 10
    auto_save: bool = True


class ResearchResult(BaseModel):
    title: str
    description: Optional[str] = None
    source_url: Optional[str] = None
    source: Optional[str] = None
    tags: Optional[str] = None
    confidence_score: float = 0.5
    saved: bool = False


@router.post("/research", response_model=List[ResearchResult])
async def run_research(
    request: ResearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Запустить Research Agent"""
    agent = ResearchAgent()
    results = await agent.research(request.query, request.max_results)

    saved_results: List[ResearchResult] = []
    for item in results:
        saved = False

        confidence = float(item.get("confidence_score", 0.5) or 0.5)

        # Сохраняем в библиотеку если confidence >= 0.5 и auto_save=True
        if request.auto_save and confidence >= 0.5:
            doc = Document(
                title=(item.get("title", "Без названия") or "Без названия")[:499],
                description=(item.get("description") or None),
                source_url=item.get("source_url"),
                file_type="url",
                source=DocumentSource.AGENT,
                status=DocumentStatus.PENDING,
                tags=item.get("tags", f"агент, {request.query}"),
                confidence_score=confidence,
            )
            db.add(doc)
            saved = True

        saved_results.append(
            ResearchResult(
                title=item.get("title", "") or "",
                description=item.get("description", "") or "",
                source_url=item.get("source_url"),
                source=item.get("source"),
                tags=item.get("tags"),
                confidence_score=confidence,
                saved=saved,
            )
        )

    # Логируем работу агента
    log = AgentLog(
        agent_name="research_agent",
        action=f"search: {request.query}",
        status="success",
        output_data=f"Найдено: {len(results)}, сохранено: {sum(1 for r in saved_results if r.saved)}",
    )
    db.add(log)

    await db.commit()
    return saved_results


@router.get("/logs")
async def get_agent_logs(db: AsyncSession = Depends(get_db)):
    """Получить логи работы агентов"""
    result = await db.execute(select(AgentLog).order_by(AgentLog.created_at.desc()).limit(50))
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "agent_name": log.agent_name,
            "action": log.action,
            "status": log.status,
            "output_data": log.output_data,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


class DesignRequest(BaseModel):
    title: str


@router.post("/design")
async def run_design_agent(
    request: DesignRequest,
    db: AsyncSession = Depends(get_db),
):
    """Запустить Design Agent — генерация ТЗ"""
    agent = DesignAgent()
    result = await agent.generate_tz(request.title, db)
    return result


@router.get("/tz")
async def get_all_tz(db: AsyncSession = Depends(get_db)):
    """Получить все ТЗ"""
    result = await db.execute(select(TechnicalSpec).order_by(TechnicalSpec.created_at.desc()))
    specs = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "version": s.version,
            "status": s.status.value,
            "created_at": s.created_at.isoformat(),
        }
        for s in specs
    ]


@router.get("/tz/{spec_id}")
async def get_tz(spec_id: str, db: AsyncSession = Depends(get_db)):
    """Получить ТЗ с разделами"""
    try:
        spec_uuid = uuid.UUID(spec_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Некорректный spec_id") from e

    result = await db.execute(select(TechnicalSpec).where(TechnicalSpec.id == spec_uuid))
    spec = result.scalar_one_or_none()
    if not spec:
        raise HTTPException(status_code=404, detail="ТЗ не найдено")  # так правильно в FastAPI [web:277]

    sections_result = await db.execute(
        select(TZSection)
        .where(TZSection.spec_id == spec_uuid)
        .order_by(TZSection.order_index)
    )
    sections = sections_result.scalars().all()

    return {
        "id": str(spec.id),
        "title": spec.title,
        "version": spec.version,
        "status": spec.status.value,
        "created_at": spec.created_at.isoformat(),
        "sections": [
            {
                "id": str(s.id),
                "title": s.title,
                "content": s.content,
                "order_index": s.order_index,
            }
            for s in sections
        ],
    }
