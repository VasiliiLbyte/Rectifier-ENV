import os
import json
import hashlib
import logging
import re
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from urllib.parse import urlparse

from tavily import TavilyClient
from openai import OpenAI

logger = logging.getLogger(__name__)

class DocumentCollector:
    """Агент для сбора документов из различных источников"""
    
    SUPPORTED_EXTENSIONS = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.doc': 'application/msword',
        '.xls': 'application/vnd.ms-excel',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.ppt': 'application/vnd.ms-powerpoint'
    }
    
    def __init__(self):
        # Проверяем наличие ключей
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.perplexity_api_key = os.getenv("PERPLEXITY_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if not self.tavily_api_key:
            logger.warning("TAVILY_API_KEY не установлен")
        if not self.perplexity_api_key:
            logger.warning("PERPLEXITY_API_KEY не установлен")
        
        # Инициализация клиентов
        self.tavily = TavilyClient(api_key=self.tavily_api_key) if self.tavily_api_key else None
        
        # Для Perplexity используем OpenAI клиент с другим base_url
        if self.perplexity_api_key:
            self.perplexity_client = OpenAI(
                api_key=self.perplexity_api_key,
                base_url="https://api.perplexity.ai"
            )
        else:
            self.perplexity_client = None
            
        self.library_path = Path(__file__).parent.parent.parent / "library"
        
    def collect_by_query(self, query: str, max_sources: int = 10) -> Dict[str, Any]:
        """
        Основной метод: собирает документы по запросу
        Возвращает отчёт о собранных документах
        """
        logger.info(f"Начинаем сбор по запросу: {query}")
        
        if not self.tavily:
            raise Exception("Tavily API ключ не настроен")
        if not self.perplexity_client:
            raise Exception("Perplexity API ключ не настроен")
        
        # Шаг 1: Генерируем варианты поисковых запросов через Perplexity
        search_queries = self._generate_search_queries(query)
        logger.info(f"Сгенерировано запросов: {len(search_queries)}")
        
        # Шаг 2: Для каждого запроса генерируем файловые варианты
        file_queries = []
        for q in search_queries:
            file_queries.append(q)
            file_queries.append(f"{q} filetype:pdf")
            file_queries.append(f"{q} скачать ГОСТ PDF")
            file_queries.append(f"{q} documentation PDF download")
        
        all_urls = []
        
        # Шаг 3: Выполняем поиск по всем запросам через Tavily
        for q in file_queries:
            logger.info(f"Поиск по запросу: {q}")
            tavily_results = self._search_tavily(q, limit=max_sources)
            all_urls.extend([r["url"] for r in tavily_results])
        
        # Шаг 4: Дедуплицируем URL
        unique_urls = list(set(all_urls))
        logger.info(f"Уникальных URL найдено: {len(unique_urls)}")
        
        # Шаг 5: Обрабатываем каждый URL (скачиваем файл или извлекаем текст)
        saved_count = 0
        for url in unique_urls[:max_sources * 2]:  # берём больше на случай неудач
            result = self._process_url(url, source_query=query)
            if result:
                saved_count += 1
        
        # Получаем ответ от Perplexity для отчёта
        perplexity_response = self._search_perplexity(query)
        
        return {
            "query": query,
            "sources_found": len(unique_urls),
            "documents_saved": saved_count,
            "perplexity_response": perplexity_response.get("answer", "")[:200] + "..."
        }
    
    def _generate_search_queries(self, original_query: str) -> List[str]:
        """
        Генерирует список поисковых запросов на основе исходного запроса
        """
        if not self.perplexity_client:
            return [original_query]
        
        prompt = f"""
        На основе исходного запроса: "{original_query}"
        Сгенерируй 3-5 различных вариантов поисковых запросов для поиска документов, 
        нормативных актов, ГОСТов, технических статей и т.п. по этой теме.
        Каждый запрос должен быть на русском языке, максимум 10 слов.
        Верни только список, каждый запрос с новой строки, без нумерации.
        """
        
        try:
            response = self.perplexity_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="sonar",
                max_tokens=200
            )
            text = response.choices[0].message.content
            # Разбиваем на строки, убираем пустые и лишние пробелы
            queries = [line.strip() for line in text.split('\n') if line.strip()]
            # Добавляем исходный запрос, если его нет
            if original_query not in queries:
                queries.insert(0, original_query)
            return queries[:5]  # максимум 5
        except Exception as e:
            logger.error(f"Ошибка генерации запросов: {e}")
            return [original_query]
    
    def _search_perplexity(self, query: str) -> Dict:
        """Поиск через Perplexity с получением ссылок на источники"""
        if not self.perplexity_client:
            return {"answer": "Perplexity не настроен", "citations": []}
        
        try:
            response = self.perplexity_client.chat.completions.create(
                messages=[{
                    "role": "user", 
                    "content": f"Найди нормативные документы, ГОСТы и технические статьи по теме: {query}. Верни ответ со списком ссылок на источники."
                }],
                model="sonar",
                max_tokens=500
            )
            return {
                "answer": response.choices[0].message.content,
                "citations": getattr(response, "citations", [])
            }
        except Exception as e:
            logger.error(f"Perplexity error: {e}")
            return {"answer": f"Ошибка: {e}", "citations": []}
    
    def _search_tavily(self, query: str, limit: int = 5) -> List[Dict]:
        """Поиск через Tavily"""
        if not self.tavily:
            return []
        try:
            response = self.tavily.search(
                query=query,
                search_depth="advanced",
                max_results=limit,
                include_domains=["gost.ru", "docs.cntd.ru", "ieee.org", "wikipedia.org", "standartgost.ru"]
            )
            return response.get("results", [])
        except Exception as e:
            logger.error(f"Tavily search error: {e}")
            return []
    
    def _process_url(self, url: str, source_query: str) -> Optional[Dict]:
        """
        Обрабатывает URL: определяет тип контента и сохраняет в библиотеку
        """
        try:
            # Сначала пытаемся определить тип по Content-Type
            content_type = self._get_content_type(url)
            if content_type:
                for ext, mime in self.SUPPORTED_EXTENSIONS.items():
                    if mime in content_type:
                        return self._download_file(url, ext, source_query)
            
            # Если не определили по Content-Type, пробуем по расширению в URL
            parsed = urlparse(url)
            path = parsed.path
            ext = Path(path).suffix.lower()
            
            if ext in self.SUPPORTED_EXTENSIONS:
                return self._download_file(url, ext, source_query)
            else:
                # Иначе извлекаем текст через Tavily
                return self._extract_text(url, source_query)
        except Exception as e:
            logger.error(f"Ошибка обработки URL {url}: {e}")
            return None
    
    def _get_content_type(self, url: str) -> Optional[str]:
        """Выполняет HEAD-запрос для определения Content-Type"""
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                return response.headers.get('Content-Type', '').lower()
        except Exception as e:
            logger.debug(f"HEAD запрос не удался для {url}: {e}")
        return None
    
    def _download_file(self, url: str, ext: str, source_query: str) -> Optional[Dict]:
        """
        Скачивает бинарный файл по URL и сохраняет в библиотеку
        """
        try:
            response = requests.get(url, timeout=30, stream=True)
            if response.status_code != 200:
                logger.warning(f"Не удалось скачать {url}: {response.status_code}")
                return None
            
            filename = self._generate_filename(url, ext)
            filepath = self.library_path / filename
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Сохранён файл: {filepath}")
            return {"url": url, "filepath": str(filepath), "ext": ext}
        except Exception as e:
            logger.error(f"Ошибка скачивания {url}: {e}")
            return None
    
    def _extract_text(self, url: str, source_query: str) -> Optional[Dict]:
        """
        Извлекает текст из веб-страницы через Tavily Extract и сохраняет как .md
        """
        if not self.tavily:
            return None
        try:
            response = self.tavily.extract(urls=[url], extract_depth="advanced")
            results = response.get("results", [])
            if not results:
                return None
            
            doc = results[0]
            content = doc.get("raw_content", "")
            if not content:
                return None
            
            filename = self._generate_filename(url, ".md")
            filepath = self.library_path / filename
            
            metadata = f"""---
source: {url}
collected_at: {datetime.now().isoformat()}
query: {source_query}
---

"""
            full_content = metadata + content
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(full_content)
            
            logger.info(f"Сохранён текст: {filepath}")
            return {"url": url, "filepath": str(filepath), "ext": ".md"}
        except Exception as e:
            logger.error(f"Ошибка извлечения текста из {url}: {e}")
            return None
    
    def _generate_filename(self, url: str, ext: str = ".md") -> str:
        """Генерирует безопасное имя файла из URL с указанным расширением"""
        name = re.sub(r'https?://', '', url)
        name = re.sub(r'[^a-zA-Z0-9а-яА-Я.-]', '_', name)
        
        if len(name) > 100:
            name = name[:100]
        
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        name = re.sub(r'\.\w+$', '', name)
        
        return f"{name}_{url_hash}{ext}"
