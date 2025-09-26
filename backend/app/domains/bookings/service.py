# app/domains/bookings/service.py
from sqlalchemy.orm import Session
from .models import Booking, BookingStatusEnum
from .repo import BookingRepo

def create_booking(db: Session, *, user_id: int, court_id: int, start, end, price):
    repo = BookingRepo(db)
    if repo.exists_overlap(court_id, start, end):
        raise ValueError("Solapamiento")

    b = Booking(
        user_id=user_id, court_id=court_id,
        start_datetime=start, end_datetime=end,
        price_total=price, status=BookingStatusEnum.CONFIRMED
    )
    repo.add(b)
    db.commit()    # commit en service (o en Unit of Work)
    db.refresh(b)
    return b
