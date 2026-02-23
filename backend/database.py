"""Database setup and models for Pet Collar QR"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer
from datetime import datetime

def _get_database_url() -> str:
    """Use Postgres on Vercel (POSTGRES_URL from Neon/Marketplace), else SQLite."""
    url = os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")
    if url:
        # SQLAlchemy async needs postgresql+asyncpg://
        if url.startswith("postgresql://"):
            return "postgresql+asyncpg://" + url[len("postgresql://"):]
        if url.startswith("postgres://"):
            return "postgresql+asyncpg://" + url[len("postgres://"):]
        return url
    return os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pet_collar.db")

DATABASE_URL = _get_database_url()

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Collar(Base):
    """Each physical collar has one record identified by unique_id"""
    __tablename__ = "collars"

    id = Column(Integer, primary_key=True, autoincrement=True)
    unique_id = Column(String(32), unique=True, index=True, nullable=False)
    is_claimed = Column(Boolean, default=False)
    pin_hash = Column(String(128), nullable=True)
    pet_data = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_contact = Column(String(255), nullable=True)  # Optional: phone/email for finder


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
