import os
import json
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from app.agents.sources.gost_searcher import GostSearcher
from app.agents.sources.cyberleninka_searcher import CyberLenikaSearcher
from app.agents.sources.web_searcher import WebSearcher


class ResearchAgent:
    """
    Оркестратор поиска.
    Собирает данные из ГОСТ, КиберЛенинки и Tavily,
    затем GPT-4o оценивает и ранжирует результаты.
    """

    def __init__(self):
        self.openai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.gost = GostSearcher()
        self.cyberleninka = CyberLenikaSearcher()
        self.web = WebSearcher()

    async def research(self, query: str, max_results: int = 15) -> List[Dict]:
        """Основной метод поиска"""
        print(f"[ResearchAgent] Запрос: {query}")

        # Параллельный поиск по всем источникам
        import asyncio
        gost_results, cyber_results, web_results = await asyncio.gather(
            self.gost.search(query),
            self.cyberleninka.search(query),
            self.web.search(query),
            return_exceptions=True
        )

        all_results = []
        for r in [gost_results, cyber_results, web_results]:
            if isinstance(r, list):
                all_results.extend(r)

        print(f"[ResearchAgent] Найдено: {len(all_results)} результатов")

        if not all_results:
            return []

        # GPT-4o анализирует и ранжирует результаты
        ranked = await self._rank_and_filter(query, all_results)
        return ranked[:max_results]

    async def _rank_and_filter(self, query: str, results: List[Dict]) -> List[Dict]:
        """GPT-4o оценивает релевантность каждого результата"""
        try:
            results_text = json.dumps(
                [{"title": r["title"], "description": r.get("description", ""),
                  "source": r.get("source", ""), "url": r.get("source_url", "")}
                 for r in results],
                ensure_ascii=False, indent=2
            )

            response = await self.openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Ты — технический эксперт по силовой электронике и тяговым подстанциям РЖД. "
                            "Оцени релевантность найденных документов для инженерного проекта. "
                            "Верни JSON массив с полями: index (номер из списка), "
                            "relevance_score (0.0-1.0), reason (кратко на русском). "
                            "Отдавай ТОЛЬКО валидный JSON без markdown блоков."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Запрос: {query}\n\n"
                            f"Найденные документы:\n{results_text}\n\n"
                            f"Оцени релевантность каждого документа."
                        )
                    }
                ],
                temperature=0.1,
                max_tokens=2000
            )

            rankings_text = response.choices[0].message.content.strip()
            rankings = json.loads(rankings_text)

            # Применяем оценки GPT к результатам
            for rank in rankings:
                idx = rank.get("index", 0)
                if 0 <= idx < len(results):
                    results[idx]["confidence_score"] = rank.get("relevance_score", 0.5)
                    results[idx]["gpt_reason"] = rank.get("reason", "")

            # Сортируем по confidence
            results.sort(key=lambda x: x.get("confidence_score", 0), reverse=True)

        except Exception as e:
            print(f"[ResearchAgent] GPT ранжирование упало: {e}")

        return results
