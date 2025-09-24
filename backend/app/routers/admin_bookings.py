from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from datetime import datetime
from app.deps import get_db, get_current_user, require_owner
from app.models.user import User
from app.models.venue import Venue
from app.models.court import Court
from app.models.booking import Booking

router = APIRouter(prefix="/admin/bookings", tags=["admin-bookings"])

def owned_venue_ids(db: Session, owner_id: int):
    return db.scalars(select(Venue.id).where(Venue.owner_user_id == owner_id)).all()

@router.get("", response_model=list[dict], dependencies=[Depends(require_owner)])
def owner_bookings(
    from_: str | None = Query(None, alias="from"),
    to_: str | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    v_ids = owned_venue_ids(db, me.id)
    if not v_ids:
        return []
    q = select(Booking).join(Court, Court.id == Booking.court_id).where(Court.venue_id.in_(v_ids))
    if from_:
        q = q.where(Booking.start_datetime >= datetime.fromisoformat(from_))
    if to_:
        q = q.where(Booking.start_datetime < datetime.fromisoformat(to_))
    rows = db.scalars(q).all()
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
