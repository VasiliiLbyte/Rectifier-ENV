from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.database import init_db
from app.api.documents import router as documents_router
from app.api.agents import router as agents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("✅ База данных инициализирована")
    yield
    print("🛑 Сервер остановлен")


app = FastAPI(
    title="Rectifier Engineering Environment",
    description="AI-агентная среда для разработки выпрямителя тяговых подстанций",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(agents_router)



@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Rectifier ENV запущен",
        "version": "0.1.0"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
