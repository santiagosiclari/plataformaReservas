# app/routers/availability.py
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
# from zoneinfo import ZoneInfo  # si usás tz aware

from app.core.deps import get_db
from app.domains.schedules.models import CourtSchedule
from app.domains.bookings.models import Booking
from app.shared.enums import BookingStatusEnum
from app.domains.pricing.models import Price

router = APIRouter(prefix="/courts", tags=["availability"])

@router.get("/{court_id}/availability")
def get_availability(
    court_id: int,
    date_str: str = Query(..., alias="date", description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    # 1) Validar fecha
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")

    weekday = target_date.weekday()

    # 2) Traer schedule del día
    sched: Optional[CourtSchedule] = db.execute(
        select(CourtSchedule).where(
            and_(CourtSchedule.court_id == court_id, CourtSchedule.weekday == weekday)
        )
    ).scalar_one_or_none()

    if not sched:
        return {"court_id": court_id, "date": date_str, "slot_minutes": None, "slots": []}

    slot_minutes = sched.slot_minutes

    # tz = ZoneInfo("America/Argentina/Buenos_Aires")  # si trabajás aware
    day_open = datetime.combine(target_date, sched.open_time)  # .replace(tzinfo=tz)
    day_close = datetime.combine(target_date, sched.close_time)  # .replace(tzinfo=tz)

    if day_open >= day_close:
        # defensa básica ante datos mal cargados
        return {"court_id": court_id, "date": date_str, "slot_minutes": slot_minutes, "slots": []}

    # 3) Bookings activos que se solapen con la ventana del día
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

    # 4) Generar slots teóricos y marcar disponibilidad
    slots: List[Dict[str, Any]] = []
    current = day_open
    step = timedelta(minutes=slot_minutes)

    while current + step <= day_close:
        next_dt = current + step

        # Convención de solapamiento semiabierto: [start, end)
        is_free = True
        for bk in bookings:
            if current < bk.end_datetime and next_dt > bk.start_datetime:
                is_free = False
                break

        # 5) Resolver precio: regla que cubra completamente el slot
        s_t, e_t = current.time(), next_dt.time()
        price_rule: Optional[Price] = db.execute(
            select(Price).where(
                and_(
                    Price.court_id == court_id,
                    Price.weekday == weekday,
                    Price.start_time <= s_t,
                    Price.end_time >= e_t,
                )
            )
            # .order_by(Price.priority.desc())   # si tenés un campo de prioridad
        ).scalar_one_or_none()

        slots.append({
            "start": current.isoformat(),
            "end": next_dt.isoformat(),
            "available": is_free,
            "price_per_slot": float(price_rule.price_per_slot) if price_rule else None,
            "currency": "ARS",
        })
        current = next_dt

    # (Opcional) Ocultar slots pasados si la fecha es hoy
    # now = datetime.now(tz)  # si usás tz aware
    # if target_date == now.date():
    #     slots = [s for s in slots if datetime.fromisoformat(s["start"]) > now]

    return {
        "court_id": court_id,
        "date": date_str,
        "slot_minutes": slot_minutes,
        "slots": slots,
    }
