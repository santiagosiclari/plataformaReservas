from datetime import datetime, time, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, require_owner

from app.domains.bookings.models import Booking
from app.domains.venues.models import Court, Venue
from app.shared.enums import BookingStatusEnum
from app.domains.pricing.models import Price
from app.domains.schedules.models import CourtSchedule  # si tu modelo está en app/models/schedule.py
from app.domains.bookings.schemas import BookingCreate, BookingUpdate, BookingOut
from app.domains.users.models import User

router = APIRouter(prefix="/bookings", tags=["bookings"])

# -------------------------
# Helpers
# -------------------------

def _get_court(db: Session, court_id: int) -> Court:
    court = db.get(Court, court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Court no encontrada")
    return court

def _get_booking(db: Session, booking_id: int) -> Booking:
    bk = db.get(Booking, booking_id)
    if not bk:
        raise HTTPException(status_code=404, detail="Booking no encontrada")
    return bk

def _weekday_of(dt: datetime) -> int:
    # 0=lunes .. 6=domingo (Python default)
    return dt.weekday()

def _time_of(dt: datetime) -> time:
    return dt.time()

def _duration_minutes(start: datetime, end: datetime) -> int:
    return int((end - start).total_seconds() // 60)

def _aligned_to_slot(start: datetime, slot_minutes: int) -> bool:
    return (start.minute % slot_minutes) == 0 and start.second == 0 and start.microsecond == 0

def _validate_within_schedule(db: Session, court_id: int, start: datetime, end: datetime):
    """Valida que start/end estén dentro del horario del día y alineados al slot."""
    wd = _weekday_of(start)
    if _weekday_of(end) != wd:
        raise HTTPException(status_code=422, detail="La reserva no puede cruzar días. Usa un solo día por booking.")

    sched: CourtSchedule | None = db.execute(
        select(CourtSchedule).where(
            and_(CourtSchedule.court_id == court_id, CourtSchedule.weekday == wd)
        )
    ).scalar_one_or_none()

    if not sched:
        raise HTTPException(status_code=422, detail="La cancha no tiene horario definido para ese día.")

    start_t, end_t = _time_of(start), _time_of(end)
    if not (sched.open_time <= start_t < sched.close_time and sched.open_time < end_t <= sched.close_time):
        raise HTTPException(
            status_code=422,
            detail=f"Horario fuera de rango. Abierto {sched.open_time.strftime('%H:%M')}–{sched.close_time.strftime('%H:%M')}"
        )

    dur = _duration_minutes(start, end)
    if dur <= 0:
        raise HTTPException(status_code=422, detail="end_datetime debe ser posterior a start_datetime.")

    if (dur % sched.slot_minutes) != 0:
        raise HTTPException(
            status_code=422,
            detail=f"La duración debe ser múltiplo de {sched.slot_minutes} minutos."
        )

    if not _aligned_to_slot(start, sched.slot_minutes):
        raise HTTPException(
            status_code=422,
            detail=f"La hora de inicio debe estar alineada a bloques de {sched.slot_minutes} minutos (mm % {sched.slot_minutes} == 0)."
        )

def _assert_no_overlap(db: Session, court_id: int, start: datetime, end: datetime, exclude_booking_id: Optional[int] = None):
    """Chequea superposición contra reservas vigentes (no CANCELLED)."""
    q = select(Booking).where(
        and_(
            Booking.court_id == court_id,
            Booking.status != BookingStatusEnum.CANCELLED,
            # overlap: (start < existing.end) AND (end > existing.start)
            Booking.start_datetime < end,
            Booking.end_datetime > start,
        )
    )
    if exclude_booking_id is not None:
        q = q.where(Booking.id != exclude_booking_id)

    exists = db.execute(q).first()
    if exists:
        raise HTTPException(status_code=409, detail="La franja horaria ya está reservada para esa cancha.")

def _compute_price_total(db: Session, court_id: int, start: datetime, end: datetime) -> float:
    wd = _weekday_of(start)
    if _weekday_of(end) != wd:
        # ya lo frenás en _validate_within_schedule, pero por las dudas
        raise HTTPException(status_code=422, detail="La reserva no puede cruzar días.")

    # Traer slot_minutes desde el schedule
    sched: CourtSchedule | None = db.execute(
        select(CourtSchedule).where(
            and_(CourtSchedule.court_id == court_id, CourtSchedule.weekday == wd)
        )
    ).scalar_one_or_none()
    if not sched:
        raise HTTPException(status_code=422, detail="No hay horario definido para ese día.")

    slot = sched.slot_minutes
    total_min = _duration_minutes(start, end)
    slots = total_min // slot
    if slots <= 0:
        raise HTTPException(status_code=422, detail="Duración inválida.")

    total = 0.0
    # Recorremos slot por slot
    for i in range(slots):
        s_i = start + timedelta(minutes=i * slot)
        e_i = s_i + timedelta(minutes=slot)
        s_t, e_t = _time_of(s_i), _time_of(e_i)

        # Regla que cubra COMPLETO ese slot
        rule = db.execute(
            select(Price).where(
                and_(
                    Price.court_id == court_id,
                    Price.weekday == wd,
                    Price.start_time <= s_t,
                    Price.end_time >= e_t,   # cubre el final inclusive
                )
            )
        ).scalar_one_or_none()

        if not rule:
            raise HTTPException(
                status_code=422,
                detail=f"No hay regla de precio que cubra el slot {s_t.strftime('%H:%M')}–{e_t.strftime('%H:%M')}."
            )

        total += float(rule.price_per_slot)

    return round(total, 2)

# -------------------------
# Endpoints
# -------------------------

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Si querés forzar user_id = user.id y no desde el body:
    # user_id = user.id
    user_id = payload.user_id

    # Validaciones base
    court = _get_court(db, payload.court_id)
    _validate_within_schedule(db, court.id, payload.start_datetime, payload.end_datetime)
    _assert_no_overlap(db, court.id, payload.start_datetime, payload.end_datetime)

    computed_total = _compute_price_total(db, court.id, payload.start_datetime, payload.end_datetime)

    bk = Booking(
        user_id=user_id,
        court_id=court.id,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        price_total=computed_total,
        status=payload.status or BookingStatusEnum.CONFIRMED,
    )
    db.add(bk)
    db.commit()
    db.refresh(bk)
    return bk

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    bk = _get_booking(db, booking_id)
    return bk

@router.get("", response_model=List[BookingOut])
def list_bookings(
    court_id: Optional[int] = None,
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = select(Booking)
    if court_id is not None:
        q = q.where(Booking.court_id == court_id)
    if user_id is not None:
        q = q.where(Booking.user_id == user_id)
    if date_from is not None:
        q = q.where(Booking.start_datetime >= date_from)
    if date_to is not None:
        q = q.where(Booking.start_datetime < date_to)

    q = q.order_by(Booking.start_datetime.asc())
    rows = db.execute(q).scalars().all()
    return rows

@router.patch("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, payload: BookingUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    bk = _get_booking(db, booking_id)

    new_start = payload.start_datetime or bk.start_datetime
    new_end = payload.end_datetime or bk.end_datetime

    # Si cambian ventana, revalidar contra horario y superposición
    if payload.start_datetime or payload.end_datetime:
        _validate_within_schedule(db, bk.court_id, new_start, new_end)
        _assert_no_overlap(db, bk.court_id, new_start, new_end, exclude_booking_id=bk.id)
        bk.price_total = _compute_price_total(db, bk.court_id, new_start, new_end)

    if payload.status is not None:
        bk.status = payload.status

    bk.start_datetime = new_start
    bk.end_datetime = new_end

    db.commit()
    db.refresh(bk)
    return bk

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    bk = _get_booking(db, booking_id)
    if bk.status == BookingStatusEnum.CANCELLED:
        return
    bk.status = BookingStatusEnum.CANCELLED
    db.commit()
    return

def owned_venue_ids(db: Session, owner_id: int):
    return db.scalars(select(Venue.id).where(Venue.owner_user_id == owner_id)).all()

@router.get("/admin/bookings", response_model=list[dict], dependencies=[Depends(require_owner)])
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
