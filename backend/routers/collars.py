"""Collar API endpoints"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db, Collar
from pydantic import BaseModel
from models.schemas import CollarSetup, CollarUpdate, CollarView
from utils.auth import hash_pin, verify_pin

router = APIRouter()


@router.get("/{unique_id}", response_model=CollarView)
async def get_collar(unique_id: str, db: AsyncSession = Depends(get_db)):
    """Get collar info - public, read-only for non-owners. Creates if not exists (first scan)."""
    result = await db.execute(select(Collar).where(Collar.unique_id == unique_id))
    collar = result.scalar_one_or_none()
    if not collar:
        collar = Collar(unique_id=unique_id, is_claimed=False)
        db.add(collar)
        await db.flush()
    
    pet_data = json.loads(collar.pet_data) if collar.pet_data else None
    return CollarView(
        unique_id=collar.unique_id,
        is_claimed=collar.is_claimed,
        pet_data=pet_data,
        owner_contact=collar.owner_contact if collar.is_claimed else None
    )


@router.post("/{unique_id}/setup")
async def setup_collar(unique_id: str, data: CollarSetup, db: AsyncSession = Depends(get_db)):
    """Claim and setup collar - first time only. Creates collar if not exists (for dev)."""
    result = await db.execute(select(Collar).where(Collar.unique_id == unique_id))
    collar = result.scalar_one_or_none()
    if not collar:
        collar = Collar(unique_id=unique_id, is_claimed=False)
        db.add(collar)
        await db.flush()
    if collar.is_claimed:
        raise HTTPException(status_code=400, detail="این قلاده قبلاً ثبت شده است")
    
    collar.is_claimed = True
    collar.pin_hash = hash_pin(data.pin)
    collar.pet_data = data.pet_data.model_dump_json()
    collar.owner_contact = data.owner_contact
    return {"message": "قلاده با موفقیت ثبت شد", "unique_id": unique_id}


@router.put("/{unique_id}/update")
async def update_collar(unique_id: str, data: CollarUpdate, db: AsyncSession = Depends(get_db)):
    """Update pet data - requires correct PIN"""
    result = await db.execute(select(Collar).where(Collar.unique_id == unique_id))
    collar = result.scalar_one_or_none()
    if not collar:
        raise HTTPException(status_code=404, detail="قلاده یافت نشد")
    if not collar.is_claimed:
        raise HTTPException(status_code=400, detail="قلاده هنوز ثبت نشده است")
    if not verify_pin(data.pin, collar.pin_hash):
        raise HTTPException(status_code=403, detail="رمز اشتباه است")
    
    collar.pet_data = data.pet_data.model_dump_json()
    return {"message": "اطلاعات با موفقیت به‌روزرسانی شد"}


class VerifyPinRequest(BaseModel):
    pin: str


@router.post("/{unique_id}/verify-pin")
async def verify_owner_pin(unique_id: str, body: VerifyPinRequest, db: AsyncSession = Depends(get_db)):
    """Check if PIN is correct - for frontend to show edit UI"""
    result = await db.execute(select(Collar).where(Collar.unique_id == unique_id))
    collar = result.scalar_one_or_none()
    if not collar or not collar.is_claimed or not collar.pin_hash:
        return {"valid": False}
    return {"valid": verify_pin(body.pin, collar.pin_hash)}
