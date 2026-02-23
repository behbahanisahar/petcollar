"""Pydantic schemas for API"""
from pydantic import BaseModel, Field
from typing import Optional


class PetData(BaseModel):
    """Pet information stored on collar"""
    name: str = Field(..., description="نام حیوان")
    species: str = Field(..., description="نوع حیوان (سگ، گربه، ...)")
    breed: Optional[str] = Field(None, description="نژاد")
    age: Optional[str] = Field(None, description="سن")
    color: Optional[str] = Field(None, description="رنگ")
    notes: Optional[str] = Field(None, description="توضیحات اضافی")
    medical_notes: Optional[str] = Field(None, description="نکات پزشکی مهم")
    owner_name: Optional[str] = Field(None, description="نام صاحب")


class CollarSetup(BaseModel):
    """Request to claim and setup a collar"""
    pet_data: PetData
    pin: str = Field(..., min_length=4, max_length=8)
    owner_contact: Optional[str] = None


class CollarUpdate(BaseModel):
    """Request to update pet data (requires PIN)"""
    pet_data: PetData
    pin: str


class CollarView(BaseModel):
    """Public view of collar - read only"""
    unique_id: str
    is_claimed: bool
    pet_data: Optional[dict] = None
    owner_contact: Optional[str] = None  # Shown to finders when pet is lost
