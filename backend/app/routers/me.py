from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.booking import Booking

router = APIRouter(prefix="/me", tags=["me"])

@router.get("/bookings", response_model=list[dict])  # podés tipar con un Schema si ya lo tenés
def my_bookings(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    # Devolvé lo esencial; si tenés schema BookingOut, usalo
    rows = db.scalars(select(Booking).where(Booking.user_id == me.id)).all()
    return [
        {
            "id": b.id,
            "user_id": b.user_id,
            "court_id": b.court_id,
            "start_datetime": b.start_datetime,
            "end_datetime": b.end_datetime,
            "status": b.status,
            "price_total": b.price_total,
            "created_at": b.created_at,
        }
        for b in rows
    ]
