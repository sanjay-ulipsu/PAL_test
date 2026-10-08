import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.client import connect_db, close_db
from app.api import missions, skills
from app.api.auth import router as auth_router, profile_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
        logger.info("MongoDB connected")
    except Exception as exc:
        logger.warning("MongoDB unavailable at startup (%s) — DB-backed routes will return 503", exc)
    yield
    await close_db()


logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PAL 2.0 API",
    description="Personalized Adaptive Learning — RUAH Engine + AI Question Generation",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(missions.router, prefix="/api/v1")
app.include_router(skills.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "pal2-api"}
