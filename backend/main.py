"""
Pet Collar QR - Backend API
FastAPI backend for pet collar setup and viewing
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import collars, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Pet Collar QR API",
    description="API for pet collar setup and pet info viewing",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5040", "http://127.0.0.1:5040",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://([a-zA-Z0-9-]+\.vercel\.app|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(collars.router, prefix="/api/collars", tags=["collars"])
app.include_router(admin.router, prefix="/api/admin/collars", tags=["admin"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
