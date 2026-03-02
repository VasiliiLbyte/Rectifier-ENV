import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
import asyncio


class GostSearcher:
    """Поиск стандартов в реестре Росстандарта"""

    BASE_URL = "https://protect.gost.ru"
    RST_API = "https://www.rst.gov.ru/portal/gost/home/standarts/nationalstandarts"

    async def search(self, query: str, max_results: int = 10) -> List[Dict]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                # Поиск через protect.gost.ru
                response = await client.get(
                    f"{self.BASE_URL}/default.aspx",
                    params={"control": "6", "id": "2", "search": query}
                )
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    rows = soup.select("table.rgMasterTable tr.rgRow, table.rgMasterTable tr.rgAltRow")
                    for row in rows[:max_results]:
                        cells = row.find_all("td")
                        if len(cells) >= 3:
                            gost_num = cells[0].get_text(strip=True)
                            title = cells[1].get_text(strip=True)
                            status = cells[2].get_text(strip=True)
                            link = cells[0].find("a")
                            url = f"{self.BASE_URL}/{link['href']}" if link else None
                            if gost_num:
                                results.append({
                                    "title": f"{gost_num} — {title}",
                                    "source_url": url,
                                    "source": "ГОСТ / Росстандарт",
                                    "tags": f"ГОСТ, {query}",
                                    "status_text": status,
                                    "confidence_score": 0.95
                                })
        except Exception as e:
            print(f"[GostSearcher] Ошибка: {e}")

        # Если protect.gost.ru не дал результатов — ищем через Tavily с фильтром
        return results

    async def search_rst_opendata(self, query: str) -> List[Dict]:
        """Поиск через открытые данные rst.gov.ru"""
        results = []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    "https://www.rst.gov.ru/portal/gost/home/standarts/nationalstandarts",
                    params={"portal:componentId": "standartSearch", "query": query}
                )
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    items = soup.select(".standart-item, .standard-row")
                    for item in items[:10]:
                        title_el = item.select_one(".standart-title, h3, .title")
                        if title_el:
                            results.append({
                                "title": title_el.get_text(strip=True),
                                "source_url": "https://www.rst.gov.ru",
                                "source": "rst.gov.ru",
                                "tags": f"ГОСТ, стандарт, {query}",
                                "confidence_score": 0.9
                            })
        except Exception as e:
            print(f"[RstSearcher] Ошибка: {e}")
        return results
