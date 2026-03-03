import os
import json
import logging
from pathlib import Path
from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BASE_DIR = Path(__file__).parent.parent.parent
LIBRARY_DIR = BASE_DIR / "library"
MANIFEST_PATH = os.getenv("VALIDATION_MANIFEST_PATH", str(BASE_DIR / "validated_manifest.json"))

def load_manifest():
    if not os.path.exists(MANIFEST_PATH):
        return {"selected": []}
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def read_file_content(rel_path):
    return ""

def generate_tz(prompt):
    return "Генерация ТЗ временно отключена"

def validate_tz(tz_content):
    return "Валидация временно отключена. Тестовый ответ."
