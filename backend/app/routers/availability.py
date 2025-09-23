# app/routers/availability.py
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models.schedule import CourtSchedule
from app.models.booking import Booking
from app.models.enums import BookingStatusEnum
from app.models.price import Price

router = APIRouter(prefix="/courts", tags=["availability"])

@router.get("/{court_id}/availability")
def get_availability(
    court_id: int,
    date_str: str = Query(..., alias="date", description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    # 1) validar fecha
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")

    weekday = target_date.weekday()

    # 2) traer schedule del día
    sched: CourtSchedule | None = db.execute(
        select(CourtSchedule).where(
            and_(CourtSchedule.court_id == court_id, CourtSchedule.weekday == weekday)
        )
    ).scalar_one_or_none()

    if not sched:
        # sin horario definido -> no hay slots
        return {"court_id": court_id, "date": date_str, "slots": []}

    slot_minutes = sched.slot_minutes
    day_open = datetime.combine(target_date, sched.open_time)
    day_close = datetime.combine(target_date, sched.close_time)

    # 3) traer bookings confirmados (o no cancelados) que se solapen ese día
    bookings: List[Booking] = db.execute(
        select(Booking).where(
            and_(
                Booking.court_id == court_id,
                Booking.status != BookingStatusEnum.CANCELLED,
                Booking.start_datetime < day_close,
                Booking.end_datetime > day_open,
            )
        )
    ).scalars().all()

    # 4) generar slots y marcar disponibilidad + precio por slot
    slots: List[Dict[str, Any]] = []
    current = day_open
    while current + timedelta(minutes=slot_minutes) <= day_close:
        next_dt = current + timedelta(minutes=slot_minutes)

        # disponible si NO se solapa con ninguna booking
        is_free = True
        for bk in bookings:
            # overlap si (current < bk.end) y (next_dt > bk.start)
            if current < bk.end_datetime and next_dt > bk.start_datetime:
                is_free = False
                break

        # 5) buscar regla de precio que cubra COMPLETO el slot (si no hay, price=None)
        s_t, e_t = current.time(), next_dt.time()
        price_rule: Price | None = db.execute(
            select(Price).where(
                and_(
                    Price.court_id == court_id,
                    Price.weekday == weekday,
                    Price.start_time <= s_t,
                    Price.end_time >= e_t,
                )
            )
        ).scalar_one_or_none()

        slots.append({
            "start": current.isoformat(),
            "end": next_dt.isoformat(),
            "available": is_free,
            "price_per_slot": float(price_rule.price_per_slot) if price_rule else None,
            "currency": "ARS",  # ajustá si manejás multi-moneda
        })
        current = next_dt

    # (Opcional) si querés ocultar slots pasados cuando la consulta es “hoy”:
    # now = datetime.now()
    # if target_date == now.date():
    #     slots = [s for s in slots if datetime.fromisoformat(s["start"]) > now]

    return {"court_id": court_id, "date": date_str, "slot_minutes": slot_minutes, "slots": slots}
