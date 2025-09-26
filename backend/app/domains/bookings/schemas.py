from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.shared.enums import BookingStatusEnum


class BookingBase(BaseModel):
    start_datetime: datetime = Field(..., description="Fecha y hora de inicio de la reserva")
    end_datetime: datetime = Field(..., description="Fecha y hora de fin de la reserva")
    price_total: float = Field(..., gt=0, description="Precio total de la reserva")
    status: Optional[BookingStatusEnum] = Field(default=BookingStatusEnum.CONFIRMED)

class BookingCreate(BookingBase):
    user_id: int = Field(..., description="ID del usuario que hace la reserva")
    court_id: int = Field(..., description="ID de la cancha reservada")

class BookingUpdate(BaseModel):
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    status: Optional[BookingStatusEnum] = None

class BookingOut(BaseModel):
    id: int
    user_id: int
    court_id: int
    start_datetime: datetime
    end_datetime: datetime
    status: BookingStatusEnum
    price_total: float
    created_at: datetime

    class Config:
        from_attributes = True
