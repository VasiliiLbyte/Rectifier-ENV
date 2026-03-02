import os
from typing import List, Dict
from tavily import TavilyClient


class WebSearcher:
    """Поиск через Tavily с фокусом на российские ресурсы"""

    RU_DOMAINS = [
        "gost.ru", "rst.gov.ru", "protect.gost.ru",
        "cyberleninka.ru", "elibrary.ru", "fips.ru",
        "energy.gov.ru", "rosstandart.info", "normacs.ru",
        "docs.cntd.ru", "техэксперт.рф"
    ]

    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise ValueError("TAVILY_API_KEY не задан в .env")
        self.client = TavilyClient(api_key=api_key)

    async def search(self, query: str, max_results: int = 8) -> List[Dict]:
        results = []
        try:
            # Добавляем контекст для российских источников
            ru_query = f"{query} site:gost.ru OR site:docs.cntd.ru OR site:cyberleninka.ru"
            response = self.client.search(
                query=ru_query,
                search_depth="advanced",
                max_results=max_results,
                include_domains=self.RU_DOMAINS
            )
            for item in response.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "description": item.get("content", "")[:300],
                    "source_url": item.get("url", ""),
                    "source": "Tavily (RU)",
                    "tags": f"веб-поиск, {query}",
                    "confidence_score": item.get("score", 0.7)
                })
        except Exception as e:
            print(f"[WebSearcher] Ошибка: {e}")

            # Фолбэк — поиск без фильтра доменов
            try:
                response = self.client.search(
                    query=query,
                    search_depth="basic",
                    max_results=max_results
                )
                for item in response.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "description": item.get("content", "")[:300],
                        "source_url": item.get("url", ""),
                        "source": "Tavily",
                        "tags": f"веб-поиск, {query}",
                        "confidence_score": item.get("score", 0.6)
                    })
            except Exception as e2:
                print(f"[WebSearcher] Фолбэк тоже упал: {e2}")
        return results
