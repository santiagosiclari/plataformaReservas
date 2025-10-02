# app/domains/bookings/routers.py (extracto)
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from app.domains.bookings.service import (
    BookingListFilters,
    list_bookings_svc,
    create_booking as svc_create_booking,
    get_booking as svc_get_booking,
    update_booking as svc_update_booking,
    cancel_booking_svc,                # 👈 nuevo: cancelación con permisos (user/admin)
    confirm_booking_svc,               # 👈 nuevo: owner confirma
    decline_booking_svc,               # 👈 nuevo: owner rechaza
    expire_pending_bookings_svc,       # 👈 nuevo: job/manual
    BookingEmailContext,
    svc_list_owner_bookings,
)
from app.utils.email_templates import (
    booking_html_player_confirmed,
    booking_html_player_cancelled,
    booking_html_player_pending,
)
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, select
from typing import Optional, List
from datetime import datetime, time, timedelta
from app.domains.bookings.schemas import BookingCreate, BookingUpdate, BookingOut
from app.domains.users.models import User
from app.domains.notifications.calendar_sender import send_booking_confirmation_with_ics
from app.core.deps import get_db, get_current_user, require_owner
from app.domains.bookings.service import BookingListFilters, list_bookings_svc


router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, background_tasks: BackgroundTasks,
                   db: Session = Depends(get_db), user=Depends(get_current_user)):
    bk, ctx = svc_create_booking(
        db=db,
        user_id=user.id,
        court_id=payload.court_id,
        start=payload.start_datetime,
        end=payload.end_datetime,
        status_=payload.status,   # si viene None, el service lo fuerza a PENDING
    )

    # HTML para “pendiente”
    html = booking_html_player_pending(
        player_name=None,
        venue_name=ctx.venue_name,
        court_name=ctx.court_label,
        start=ctx.start_dt,
        end=ctx.end_dt,
        price=ctx.price_total,
    )

    # Enviá mails distintos si querés; por simplicidad mandamos uno genérico con estado pendiente
    if ctx.owner_email or ctx.player_email:
        background_tasks.add_task(
            send_booking_confirmation_with_ics,
            to_owner=ctx.owner_email,
            to_player=ctx.player_email,
            html_body=html,
            subject="Tu reserva está pendiente de confirmación ⏳",
            summary=f"Reserva en {ctx.venue_name} - {ctx.court_label} (pendiente)",
            description=f"Reserva #{ctx.booking_id} pendiente. Precio: $ {ctx.price_total:,.0f} ARS",
            location=ctx.venue_address or ctx.venue_name,
            start_dt=ctx.start_dt,
            end_dt=ctx.end_dt,
            organizer_email=ctx.organizer_email,
        )

    return bk

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return svc_get_booking(db, booking_id)

@router.get("", response_model=List[BookingOut])
def list_bookings(
    court_id: Optional[int] = None,
    user_id: Optional[int] = None,
    mine: bool = False,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    filters = BookingListFilters(
        court_id=court_id,
        user_id=user_id,
        mine=mine,
        date_from=date_from,
        date_to=date_to,
        requester_user_id=user.id,
    )
    return list_bookings_svc(db, filters)

@router.patch("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, payload: BookingUpdate,
                   db: Session = Depends(get_db), user=Depends(get_current_user)):
    bk = svc_update_booking(
        db=db,
        booking_id=booking_id,
        new_start=payload.start_datetime,
        new_end=payload.end_datetime,
        new_status=None,  # 👈 bloqueamos cambio de estado por PATCH
    )
    # (Opcional) disparar mail ICS de reprogramación
    return bk

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cancel_booking_svc(db, booking_id=booking_id, actor=user)  # respeta reglas/late window
    return

@router.get("/admin/bookings", response_model=list[dict], dependencies=[Depends(require_owner)])
def owner_bookings(
    from_: str | None = Query(None, alias="from"),
    to_: str | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    me = Depends(get_current_user),
):
    from_dt = datetime.fromisoformat(from_) if from_ else None
    to_dt   = datetime.fromisoformat(to_) if to_ else None
    rows = svc_list_owner_bookings(db, owner_id=me.id, from_dt=from_dt, to_dt=to_dt)
    # conservamos el payload de respuesta que ya tenías (dicts)
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

@router.post("/{booking_id}/confirm", response_model=BookingOut)
def confirm_booking_ep(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Solo OWNER (o admin) dentro del service
    bk = confirm_booking_svc(db, booking_id, actor=user, now=datetime.utcnow())
    return bk

@router.post("/{booking_id}/decline", response_model=BookingOut)
def decline_booking_ep(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    bk = decline_booking_svc(db, booking_id, actor=user, now=datetime.utcnow())
    # (Opcional) enviar aviso de declinación
    return bk

@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking_ep(booking_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Cancel por POST para frontend simple; DELETE queda como atajo RESTful
    bk = cancel_booking_svc(db, booking_id, actor=user, now=datetime.utcnow(), late_window_hours=24)
    return bk

# Admin/dev: barrer expiradas PENDING (simulación cron)
@router.post("/admin/expire-now", response_model=dict, dependencies=[Depends(require_owner)])
def expire_now_ep(db: Session = Depends(get_db)):
    n = expire_pending_bookings_svc(db, now=datetime.utcnow())
    return {"expired": n}