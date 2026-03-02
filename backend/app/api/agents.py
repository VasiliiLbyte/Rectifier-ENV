from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.db.models import Document, DocumentSource, DocumentStatus, AgentLog
from app.agents.research_agent import ResearchAgent
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(prefix="/api/agents", tags=["Agents"])


class ResearchRequest(BaseModel):
    query: str
    max_results: int = 10
    auto_save: bool = True


class ResearchResult(BaseModel):
    title: str
    description: Optional[str]
    source_url: Optional[str]
    source: Optional[str]
    tags: Optional[str]
    confidence_score: float
    saved: bool = False


@router.post("/research", response_model=List[ResearchResult])
async def run_research(
    request: ResearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Запустить Research Agent"""
    agent = ResearchAgent()
    results = await agent.research(request.query, request.max_results)

    saved_results = []
    for item in results:
        saved = False

        # Сохраняем в библиотеку если confidence > 0.5 и auto_save=True
        if request.auto_save and item.get("confidence_score", 0) >= 0.5:
            doc = Document(
                title=item.get("title", "Без названия")[:499],
                description=item.get("description", "")[:999] if item.get("description") else None,
                source_url=item.get("source_url"),
                file_type="url",
                source=DocumentSource.AGENT,
                status=DocumentStatus.PENDING,
                tags=item.get("tags", f"агент, {request.query}"),
                confidence_score=item.get("confidence_score", 0.5)
            )
            db.add(doc)
            saved = True

        saved_results.append(ResearchResult(
            title=item.get("title", ""),
            description=item.get("description", ""),
            source_url=item.get("source_url"),
            source=item.get("source"),
            tags=item.get("tags"),
            confidence_score=item.get("confidence_score", 0.5),
            saved=saved
        ))

    # Логируем работу агента
    log = AgentLog(
        agent_name="research_agent",
        action=f"search: {request.query}",
        status="success",
        output_data=f"Найдено: {len(results)}, сохранено: {sum(1 for r in saved_results if r.saved)}"
    )
    db.add(log)
    await db.commit()

    return saved_results


@router.get("/logs")
async def get_agent_logs(db: AsyncSession = Depends(get_db)):
    """Получить логи работы агентов"""
    result = await db.execute(
        select(AgentLog).order_by(AgentLog.created_at.desc()).limit(50)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "agent_name": log.agent_name,
            "action": log.action,
            "status": log.status,
            "output_data": log.output_data,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]
