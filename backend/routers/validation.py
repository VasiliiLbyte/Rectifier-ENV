import os
import json
import hashlib
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import logging

router = APIRouter(prefix="/api/validation", tags=["validation"])
logger = logging.getLogger(__name__)

# Пути из окружения или по умолчанию
LIBRARY_DIR = Path(os.getenv("LIBRARY_DIR", "/Users/vasilii/Desktop/rectifier-env/library"))
MANIFEST_PATH = Path(os.getenv("VALIDATION_MANIFEST_PATH", "/Users/vasilii/Desktop/rectifier-env/validated_manifest.json"))

class FileInfo(BaseModel):
    rel_path: str
    name: str
    size: int
    sha256: str
    status: str  # OK, EMPTY, TOO_LARGE, UNSUPPORTED_EXT, DUPLICATE

class ScanResponse(BaseModel):
    files: List[FileInfo]
    total: int
    ok_count: int
    duplicate_count: int

class ManifestUpdate(BaseModel):
    selected: List[str]

@router.get("/scan", response_model=ScanResponse)
async def scan_library():
    """
    Сканирует папку library, вычисляет SHA256, определяет статус.
    Поддерживаемые расширения: .pdf, .docx, .md, .txt
    """
    if not LIBRARY_DIR.exists():
        raise HTTPException(status_code=404, detail="Library directory not found")
    
    supported_ext = {'.pdf', '.docx', '.md', '.txt'}
    max_size = 50 * 1024 * 1024  # 50 MB
    files_info = []
    sha_map = {}  # для поиска дубликатов

    for file_path in LIBRARY_DIR.rglob('*'):
        if not file_path.is_file():
            continue
        
        rel_path = str(file_path.relative_to(LIBRARY_DIR))
        name = file_path.name
        size = file_path.stat().st_size
        ext = file_path.suffix.lower()
        
        # Определяем статус
        if size == 0:
            status = "EMPTY"
        elif size > max_size:
            status = "TOO_LARGE"
        elif ext not in supported_ext:
            status = "UNSUPPORTED_EXT"
        else:
            # Вычисляем SHA256
            sha256 = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(65536), b""):
                    sha256.update(chunk)
            hash_hex = sha256.hexdigest()
            
            # Проверка на дубликат
            if hash_hex in sha_map:
                status = "DUPLICATE"
                # можно сохранить оригинал для информации
            else:
                status = "OK"
                sha_map[hash_hex] = rel_path
        
        files_info.append(FileInfo(
            rel_path=rel_path,
            name=name,
            size=size,
            sha256=hash_hex if 'hash_hex' in locals() else "",
            status=status
        ))
    
    # Подсчёт статистики
    total = len(files_info)
    ok_count = sum(1 for f in files_info if f.status == "OK")
    duplicate_count = sum(1 for f in files_info if f.status == "DUPLICATE")
    
    return ScanResponse(
        files=files_info,
        total=total,
        ok_count=ok_count,
        duplicate_count=duplicate_count
    )

@router.get("/manifest", response_model=Dict[str, Any])
async def get_manifest():
    """Возвращает текущий манифест."""
    if not MANIFEST_PATH.exists():
        return {"saved_at": None, "selected_count": 0, "selected": []}
    try:
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading manifest: {e}")
        raise HTTPException(status_code=500, detail="Error reading manifest")

@router.post("/manifest")
async def save_manifest(update: ManifestUpdate):
    """Сохраняет выбранные файлы в манифест."""
    manifest = {
        "saved_at": str(Path(MANIFEST_PATH).stat().st_mtime) if MANIFEST_PATH.exists() else None,
        "selected_count": len(update.selected),
        "selected": update.selected
    }
    try:
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        return {"status": "ok", "message": "Manifest saved"}
    except Exception as e:
        logger.error(f"Error saving manifest: {e}")
        raise HTTPException(status_code=500, detail="Error saving manifest")
