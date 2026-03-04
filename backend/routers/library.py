import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import logging

router = APIRouter(prefix="/api/library", tags=["library"])
logger = logging.getLogger(__name__)

# Путь к папке library (можно вынести в .env)
LIBRARY_DIR = Path(os.getenv("LIBRARY_DIR", "/Users/vasilii/Desktop/rectifier-env/library"))

@router.get("/file/{rel_path:path}")
async def get_library_file(rel_path: str):
    """
    Возвращает файл из библиотеки по относительному пути.
    """
    # Защита от path traversal
    if ".." in rel_path or rel_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    file_path = LIBRARY_DIR / rel_path
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream"  # браузер сам определит тип
    )
