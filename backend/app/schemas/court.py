# app/schemas/court.py
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import SportEnum

class CourtBase(BaseModel):
    sport: SportEnum
    surface: Optional[str] = None
    indoor: bool = False
    number: Optional[str] = None
    notes: Optional[str] = None

class CourtCreate(CourtBase):
    pass

class CourtOut(CourtBase):
    id: int
    venue_id: int
    model_config = ConfigDict(from_attributes=True)

class CourtUpdate(BaseModel):
    sport: Optional[SportEnum] = None
    surface: Optional[str] = None
    indoor: Optional[bool] = None
    number: Optional[str] = None
    notes: Optional[str] = None

class CourtOut(CourtBase):
    id: int
    venue_id: int
    model_config = ConfigDict(from_attributes=True)