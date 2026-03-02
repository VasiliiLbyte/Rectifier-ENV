import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
import urllib.parse


class CyberLenikaSearcher:
    """Поиск научных статей через КиберЛенинку"""

    SEARCH_URL = "https://cyberleninka.ru/search"
    OAI_URL = "https://cyberleninka.ru/oai"

    async def search(self, query: str, max_results: int = 10) -> List[Dict]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (compatible; ResearchBot/1.0)"}) as client:

                response = await client.get(
                    self.SEARCH_URL,
                    params={"q": query, "page": 1}
                )
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    articles = soup.select("ul.search-result li, .article-item, li[data-id]")
                    for article in articles[:max_results]:
                        title_el = article.select_one("h2 a, .title a, a.title")
                        desc_el = article.select_one(".abstract, .description, p")
                        if title_el:
                            href = title_el.get("href", "")
                            results.append({
                                "title": title_el.get_text(strip=True),
                                "description": desc_el.get_text(strip=True)[:300] if desc_el else "",
                                "source_url": f"https://cyberleninka.ru{href}" if href.startswith("/") else href,
                                "source": "КиберЛенинка",
                                "tags": f"научная статья, {query}",
                                "confidence_score": 0.8
                            })
        except Exception as e:
            print(f"[CyberLenikaSearcher] Ошибка: {e}")
        return results

    async def oai_search(self, query: str) -> List[Dict]:
        """OAI-PMH протокол для получения метаданных"""
        results = []
        try:
            encoded = urllib.parse.quote(query)
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(
                    self.OAI_URL,
                    params={
                        "verb": "Search",
                        "query": query,
                        "metadataPrefix": "oai_dc"
                    }
                )
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "xml")
                    records = soup.find_all("record")
                    for record in records[:10]:
                        title = record.find("dc:title")
                        desc = record.find("dc:description")
                        identifier = record.find("dc:identifier")
                        if title:
                            results.append({
                                "title": title.get_text(strip=True),
                                "description": desc.get_text(strip=True)[:300] if desc else "",
                                "source_url": identifier.get_text(strip=True) if identifier else "",
                                "source": "КиберЛенинка OAI",
                                "tags": f"научная статья, {query}",
                                "confidence_score": 0.85
                            })
        except Exception as e:
            print(f"[CyberLenikaOAI] Ошибка: {e}")
        return results
