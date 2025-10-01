# app/schemas/price.py
from datetime import time
from pydantic import BaseModel, Field

class PriceBase(BaseModel):
    weekday: int = Field(..., ge=0, le=6, description="0=lun .. 6=dom")
    start_time: time
    end_time: time
    price_per_slot: float = Field(..., gt=0)

class PriceCreate(PriceBase):
    court_id: int

class PriceUpdate(BaseModel):
    weekday: int | None = Field(None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    price_per_slot: float | None = Field(None, gt=0)

class PriceOut(BaseModel):
    id: int
    court_id: int
    weekday: int
    start_time: time
    end_time: time
    price_per_slot: float

    class Config:
        from_attributes = True
