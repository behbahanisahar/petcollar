"""Admin API for collar management and QR generation"""
import json
import os
import secrets
import string
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db, Collar
from pydantic import BaseModel

router = APIRouter()


def generate_unique_id(length: int = 12) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class GenerateRequest(BaseModel):
    count: int = 10


class CollarAdminRow(BaseModel):
    unique_id: str
    is_claimed: bool
    pet_name: str | None
    owner_contact: str | None
    created_at: str


class CollarsListResponse(BaseModel):
    collars: list[CollarAdminRow]
    total: int
    total_claimed: int | None = None
    total_unclaimed: int | None = None


@router.get("", response_model=CollarsListResponse)
async def list_collars(
    status: str = Query("all", description="all | claimed | unclaimed"),
    search: str = Query("", description="Search by ID, pet name, or owner contact"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all collars with optional filter by status and search"""
    from sqlalchemy import or_
    
    base = select(Collar)
    count_q = select(func.count()).select_from(Collar)
    
    if status == "claimed":
        base = base.where(Collar.is_claimed == True)
        count_q = count_q.where(Collar.is_claimed == True)
    elif status == "unclaimed":
        base = base.where(Collar.is_claimed == False)
        count_q = count_q.where(Collar.is_claimed == False)
    
    search_term = f"%{search.strip()}%" if search and search.strip() else None
    if search_term:
        cond = or_(
            Collar.unique_id.like(search_term),
            Collar.owner_contact.like(search_term),
            Collar.pet_data.like(search_term),
        )
        base = base.where(cond)
        count_q = count_q.where(cond)
    
    total_result = await db.execute(count_q)
    total = total_result.scalar()
    
    total_claimed = None
    total_unclaimed = None
    if status == "all" and not search_term:
        claimed_r = await db.execute(select(func.count()).select_from(Collar).where(Collar.is_claimed == True))
        unclaimed_r = await db.execute(select(func.count()).select_from(Collar).where(Collar.is_claimed == False))
        total_claimed = claimed_r.scalar()
        total_unclaimed = unclaimed_r.scalar()
    
    result = await db.execute(base.order_by(Collar.created_at.desc()).limit(limit).offset(offset))
    rows = result.scalars().all()
    
    collars = []
    for c in rows:
        pet = json.loads(c.pet_data) if c.pet_data else {}
        collars.append(CollarAdminRow(
            unique_id=c.unique_id,
            is_claimed=c.is_claimed,
            pet_name=pet.get("name") if pet else None,
            owner_contact=c.owner_contact,
            created_at=c.created_at.isoformat() if c.created_at else "",
        ))
    
    return CollarsListResponse(collars=collars, total=total, total_claimed=total_claimed, total_unclaimed=total_unclaimed)


@router.post("/generate")
async def generate_collars(
    data: GenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate new collar IDs and add to database. Returns IDs for QR generation."""
    if data.count < 1 or data.count > 500:
        return {"detail": "تعداد باید بین ۱ تا ۵۰۰ باشد"}
    
    ids = []
    seen = set()
    
    while len(ids) < data.count:
        uid = generate_unique_id()
        if uid in seen:
            continue
        seen.add(uid)
        
        r = await db.execute(select(Collar).where(Collar.unique_id == uid))
        if r.scalar_one_or_none():
            continue
        ids.append(uid)
    
    for uid in ids:
        db.add(Collar(unique_id=uid, is_claimed=False))
    
    base_url = os.getenv("APP_BASE_URL", "http://localhost:5040")
    return {
        "ids": ids,
        "base_url": base_url.rstrip("/"),
        "urls": [f"{base_url.rstrip('/')}/p/{uid}" for uid in ids],
    }


@router.delete("")
async def delete_all_collars(db: AsyncSession = Depends(get_db)):
    """Delete all collar records from database"""
    from sqlalchemy import delete
    await db.execute(delete(Collar))
    return {"message": "همهٔ قلاده‌ها حذف شدند"}
