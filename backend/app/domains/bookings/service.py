# app/domains/bookings/service.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Optional
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.domains.bookings.models import Booking
from app.domains.venues.models import Court, Venue
from app.domains.users.models import User
from app.domains.schedules.models import CourtSchedule
from app.domains.pricing.models import Price
from app.shared.enums import BookingStatusEnum

# -------------------------
# Email context (para ICS/mail)
# -------------------------
@dataclass
class BookingEmailContext:
    booking_id: int
    venue_name: str
    court_label: str
    venue_address: str
    start_dt: datetime
    end_dt: datetime
    price_total: float
    owner_email: Optional[str]
    player_email: Optional[str]
    organizer_email: Optional[str]  # owner o genérico del sistema

# ------------ Filtros para list ------------
@dataclass
class BookingListFilters:
    court_id: Optional[int] = None
    user_id: Optional[int] = None
    mine: bool = False
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    requester_user_id: Optional[int] = None

# -------------------------
# Helpers internos (privados del service)
# -------------------------
def _weekday_of(dt: datetime) -> int: return dt.weekday()
def _time_of(dt: datetime) -> time: return dt.time()
def _duration_minutes(s: datetime, e: datetime) -> int: return int((e - s).total_seconds() // 60)
def _aligned_to_slot(start: datetime, slot: int) -> bool: return (start.minute % slot) == 0 and start.second == 0 and start.microsecond == 0

def _get_court_or_404(db: Session, court_id: int) -> Court:
    court = db.get(Court, court_id)
    if not court: raise HTTPException(404, "Court no encontrada")
    return court

def _get_booking_or_404(db: Session, booking_id: int) -> Booking:
    bk = db.get(Booking, booking_id)
    if not bk:
        raise HTTPException(404, "Booking no encontrada")
    return bk

def _validate_within_schedule(db: Session, court_id: int, start: datetime, end: datetime):
    wd = _weekday_of(start)
    if _weekday_of(end) != wd:
        raise HTTPException(422, "La reserva no puede cruzar días. Usa un solo día por booking.")
    sched: CourtSchedule | None = db.execute(
        select(CourtSchedule).where(and_(CourtSchedule.court_id == court_id, CourtSchedule.weekday == wd))
    ).scalar_one_or_none()
    if not sched:
        raise HTTPException(422, "La cancha no tiene horario definido para ese día.")
    st, et = _time_of(start), _time_of(end)
    if not (sched.open_time <= st < sched.close_time and sched.open_time < et <= sched.close_time):
        raise HTTPException(422, f"Horario fuera de rango. Abierto {sched.open_time.strftime('%H:%M')}–{sched.close_time.strftime('%H:%M')}")
    dur = _duration_minutes(start, end)
    if dur <= 0: raise HTTPException(422, "end_datetime debe ser posterior a start_datetime.")
    if dur % sched.slot_minutes != 0:
        raise HTTPException(422, f"La duración debe ser múltiplo de {sched.slot_minutes} minutos.")
    if not _aligned_to_slot(start, sched.slot_minutes):
        raise HTTPException(422, f"La hora de inicio debe estar alineada a bloques de {sched.slot_minutes} minutos (mm % {sched.slot_minutes} == 0).")

def _assert_no_overlap(db: Session, court_id: int, start: datetime, end: datetime, exclude_id: Optional[int] = None):
    q = select(Booking).where(
        and_(Booking.court_id == court_id, Booking.status != BookingStatusEnum.CANCELLED,
             Booking.start_datetime < end, Booking.end_datetime > start)
    )
    if exclude_id is not None:
        q = q.where(Booking.id != exclude_id)
    if db.execute(q).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "La franja horaria ya está reservada para esa cancha.")

def _compute_price_total(db: Session, court_id: int, start: datetime, end: datetime) -> float:
    wd = _weekday_of(start)
    if _weekday_of(end) != wd:
        raise HTTPException(422, "La reserva no puede cruzar días.")
    sched: CourtSchedule | None = db.execute(
        select(CourtSchedule).where(and_(CourtSchedule.court_id == court_id, CourtSchedule.weekday == wd))
    ).scalar_one_or_none()
    if not sched:
        raise HTTPException(422, "No hay horario definido para ese día.")
    slot = sched.slot_minutes
    total_min = _duration_minutes(start, end)
    slots = total_min // slot
    if slots <= 0: raise HTTPException(422, "Duración inválida.")

    total = 0.0
    for i in range(slots):
        s_i = start + timedelta(minutes=i * slot)
        e_i = s_i + timedelta(minutes=slot)
        s_t, e_t = _time_of(s_i), _time_of(e_i)
        rule = db.execute(
            select(Price).where(and_(Price.court_id == court_id, Price.weekday == wd,
                                     Price.start_time <= s_t, Price.end_time >= e_t))
        ).scalar_one_or_none()
        if not rule:
            raise HTTPException(422, f"No hay regla de precio que cubra el slot {s_t.strftime('%H:%M')}–{e_t.strftime('%H:%M')}.")
        total += float(rule.price_per_slot)
    return round(total, 2)

# -------------------------
# API del Service
# -------------------------
def create_booking(db: Session, user_id: int, court_id: int, start: datetime, end: datetime,
                   status_: Optional[BookingStatusEnum] = None) -> tuple[Booking, BookingEmailContext]:
    court = _get_court_or_404(db, court_id)
    _validate_within_schedule(db, court.id, start, end)
    _assert_no_overlap(db, court.id, start, end)
    price = _compute_price_total(db, court.id, start, end)

    bk = Booking(
        user_id=user_id,
        court_id=court.id,
        start_datetime=start,
        end_datetime=end,
        price_total=price,
        status=status_ or BookingStatusEnum.CONFIRMED,
    )
    db.add(bk)
    db.commit()
    db.refresh(bk)

    # Armar contexto para email/ICS
    venue: Venue | None = db.get(Venue, court.venue_id) if hasattr(court, "venue_id") else None
    owner: User | None = db.get(User, venue.owner_user_id) if (venue and getattr(venue, "owner_user_id", None)) else None
    player: User | None = db.get(User, user_id)

    ctx = BookingEmailContext(
        booking_id=bk.id,
        venue_name=(getattr(venue, "name", f"Venue {venue.id if venue else ''}") or "").strip(),
        court_label=getattr(court, "name", f"Court {court.id}"),
        venue_address=getattr(venue, "address", getattr(venue, "name", "")) if venue else "",
        start_dt=bk.start_datetime,
        end_dt=bk.end_datetime,
        price_total=float(bk.price_total or 0),
        owner_email=(owner.email if owner and owner.email else None),
        player_email=(player.email if player and player.email else None),
        organizer_email=(owner.email if owner and owner.email else (player.email if player and player.email else None)),
    )
    return bk, ctx

def update_booking(db: Session, booking_id: int,
                   new_start: Optional[datetime] = None,
                   new_end: Optional[datetime] = None,
                   new_status: Optional[BookingStatusEnum] = None) -> Booking:
    bk = _get_booking_or_404(db, booking_id)

    start = new_start or bk.start_datetime
    end   = new_end or bk.end_datetime

    # si cambia la ventana, recalcular y validar
    if (new_start is not None) or (new_end is not None):
        _validate_within_schedule(db, bk.court_id, start, end)
        _assert_no_overlap(db, bk.court_id, start, end, exclude_id=bk.id)
        bk.start_datetime, bk.end_datetime = start, end
        bk.price_total = _compute_price_total(db, bk.court_id, start, end)

    if new_status is not None:
        bk.status = new_status

    db.commit(); db.refresh(bk)
    return bk

def cancel_booking(db: Session, booking_id: int) -> None:
    bk = _get_booking_or_404(db, booking_id)
    if bk.status != BookingStatusEnum.CANCELLED:
        bk.status = BookingStatusEnum.CANCELLED
        db.commit()

def get_booking(db: Session, booking_id: int) -> Booking:
    return _get_booking_or_404(db, booking_id)

def list_bookings(db: Session, filters: BookingListFilters) -> list[Booking]:
    q = select(Booking)
    # resolver mine
    effective_user_id = filters.user_id
    if filters.mine and filters.requester_user_id:
        effective_user_id = filters.requester_user_id

    if filters.court_id is not None:
        q = q.where(Booking.court_id == filters.court_id)
    if effective_user_id is not None:
        q = q.where(Booking.user_id == effective_user_id)
    if filters.date_from is not None:
        q = q.where(Booking.start_datetime >= filters.date_from)
    if filters.date_to is not None:
        q = q.where(Booking.start_datetime < filters.date_to)

    q = q.order_by(Booking.start_datetime.asc())
    return list(db.execute(q).scalars().all())

def owned_venue_ids(db: Session, owner_id: int) -> list[int]:
    return db.scalars(select(Venue.id).where(Venue.owner_user_id == owner_id)).all()

def list_owner_bookings(db: Session, owner_id: int,
                        from_dt: Optional[datetime], to_dt: Optional[datetime]) -> list[Booking]:
    v_ids = owned_venue_ids(db, owner_id)
    if not v_ids:
        return []
    q = (select(Booking)
         .join(Court, Court.id == Booking.court_id)
         .where(Court.venue_id.in_(v_ids)))
    if from_dt:
        q = q.where(Booking.start_datetime >= from_dt)
    if to_dt:
        q = q.where(Booking.start_datetime < to_dt)
    return list(db.scalars(q).all())

    # --- SERVICE ---
def list_bookings_svc(db: Session, filters: BookingListFilters) -> list[Booking]:
    q = select(Booking)
    effective_user_id = filters.user_id
    if filters.mine and filters.requester_user_id:
        effective_user_id = filters.requester_user_id
    if filters.court_id is not None:
        q = q.where(Booking.court_id == filters.court_id)
    if effective_user_id is not None:
        q = q.where(Booking.user_id == effective_user_id)
    if filters.date_from is not None:
        q = q.where(Booking.start_datetime >= filters.date_from)
    if filters.date_to is not None:
        q = q.where(Booking.start_datetime < filters.date_to)
    q = q.order_by(Booking.start_datetime.asc())
    return db.execute(q).scalars().all()