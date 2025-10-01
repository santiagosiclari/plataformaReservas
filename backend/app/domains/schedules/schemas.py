from datetime import time
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class CourtScheduleBase(BaseModel):
    weekday: int = Field(..., ge=0, le=6, description="Día de la semana (0=lunes, 6=domingo)")
    open_time: time = Field(..., description="Hora de apertura (formato HH:MM)")
    close_time: time = Field(..., description="Hora de cierre (formato HH:MM)")
    slot_minutes: int = Field(default=60, gt=0, description="Duración de cada turno en minutos")

    @model_validator(mode="after")
    def check_times(self):
        if self.close_time <= self.open_time:
            raise ValueError("La hora de cierre debe ser posterior a la de apertura")
        return self


class CourtScheduleCreate(CourtScheduleBase):
    pass

class CourtScheduleUpdate(BaseModel):
    weekday: Optional[int] = Field(None, ge=0, le=6)
    open_time: Optional[time] = None
    close_time: Optional[time] = None
    slot_minutes: Optional[int] = Field(None, gt=0)

    @model_validator(mode="after")
    def check_times(self):
        if self.open_time and self.close_time and self.close_time <= self.open_time:
            raise ValueError("La hora de cierre debe ser posterior a la de apertura")
        return self


class CourtScheduleOut(CourtScheduleBase):
    id: int
    court_id: int

    class Config:
        from_attributes = True
