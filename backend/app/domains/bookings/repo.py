# app/domains/bookings/repo.py
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from .models import Booking
from datetime import datetime
from typing import Sequence, Optional

class BookingRepo:
    def __init__(self, db: Session):
        self.db = db

    # --- Escritura
    def add(self, b: Booking) -> Booking:
        self.db.add(b)
        self.db.flush()        # obtiene PK sin commit
        return b

    def delete(self, booking_id: int) -> None:
        b = self.db.get(Booking, booking_id)
        if b:
            self.db.delete(b)

    # --- Lectura
    def get(self, booking_id: int) -> Optional[Booking]:
        return self.db.get(Booking, booking_id)

    def list_by_court_between(
        self, court_id: int, start: datetime, end: datetime
    ) -> Sequence[Booking]:
        stmt = select(Booking).where(
            and_(
                Booking.court_id == court_id,
                Booking.start_datetime < end,
                Booking.end_datetime > start,
            )
        )
        return self.db.execute(stmt).scalars().all()

    def exists_overlap(self, court_id: int, start: datetime, end: datetime) -> bool:
        return bool(self.list_by_court_between(court_id, start, end))
