import os
import json
from typing import List, Dict
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Document, TechnicalSpec, TZSection, AgentLog, TZStatus


class DesignAgent:
    """
    Читает библиотеку документов и генерирует структурированное ТЗ
    """

    SECTIONS = [
        "Назначение и область применения",
        "Технические требования",
        "Требования к электрическим параметрам",
        "Требования к надёжности и ресурсу",
        "Требования к безопасности",
        "Нормативные ссылки и стандарты",
        "Условия эксплуатации",
    ]

    def __init__(self):
        self.openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_tz(self, title: str, db: AsyncSession) -> Dict:
        """Генерирует ТЗ на основе документов в библиотеке"""

        # Берём все документы из библиотеки
        result = await db.execute(select(Document).order_by(Document.confidence_score.desc()).limit(20))
        docs = result.scalars().all()

        if not docs:
            return {"error": "Библиотека пуста — сначала запустите Research Agent"}

        # Формируем контекст из документов
        context = "\n\n".join([
            f"Документ: {d.title}\nОписание: {d.description or 'нет'}\nИсточник: {d.source_url or 'загружен вручную'}"
            for d in docs
        ])

        print(f"[DesignAgent] Генерирую ТЗ на основе {len(docs)} документов...")

        # GPT-4o генерирует каждый раздел
        sections_content = {}
        for section in self.SECTIONS:
            content = await self._generate_section(section, title, context)
            sections_content[section] = content
            print(f"[DesignAgent] Раздел готов: {section}")

        # Сохраняем в БД
        spec = TechnicalSpec(
            title=title,
            status=TZStatus.DRAFT,
            content=json.dumps(sections_content, ensure_ascii=False)
        )
        db.add(spec)
        await db.flush()

        for i, (section_title, content) in enumerate(sections_content.items()):
            section = TZSection(
                spec_id=spec.id,
                title=section_title,
                content=content,
                order_index=i
            )
            db.add(section)

        log = AgentLog(
            agent_name="design_agent",
            action=f"generate_tz: {title}",
            status="success",
            output_data=f"Создано {len(self.SECTIONS)} разделов на основе {len(docs)} документов"
        )
        db.add(log)
        await db.commit()

        return {
            "id": str(spec.id),
            "title": title,
            "sections": sections_content,
            "docs_used": len(docs)
        }

    async def _generate_section(self, section: str, tz_title: str, context: str) -> str:
        response = await self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Ты — ведущий инженер-проектировщик силовой электроники с опытом "
                        "проектирования выпрямителей для тяговых подстанций РЖД. "
                        "Пиши технически грамотно, используй конкретные числовые параметры, "
                        "ссылайся на ГОСТы и стандарты из контекста. Формат — Markdown."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"ТЗ: {tz_title}\n\n"
                        f"Документы из библиотеки:\n{context[:3000]}\n\n"
                        f"Напиши раздел ТЗ: **{section}**\n"
                        f"Используй конкретные данные из документов выше."
                    )
                }
            ],
            temperature=0.2,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()
