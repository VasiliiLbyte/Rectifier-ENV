from dotenv import load_dotenv
load_dotenv()  # Загружаем переменные из .env

from fastapi import FastAPI
from routers import agents, library
from db import engine, Base
import logging

# Создание таблиц (для разработки)
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rectifier-ENV Backend", version="1.0")

app.include_router(agents.router)
app.include_router(library.router)

@app.get("/")
async def root():
    return {"message": "Rectifier-ENV API работает", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
