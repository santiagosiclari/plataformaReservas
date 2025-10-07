# app/notifications/booking_state.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Literal
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import uuid4

from app.core.db import SessionLocal
from app.domains.bookings.models import Booking
from app.domains.venues.models import Court, Venue
from app.domains.users.models import User
from app.shared.enums import BookingStatusEnum
from app.utils.email_templates import (
    booking_html_for_owner,
    booking_html_player_confirmed,
    booking_html_player_cancelled,
    booking_html_player_pending,
)
from app.utils.email_smtp import send_html_email_gmail  # tu sender con ICS adjunto

CalendarMethod = Literal["REQUEST", "CANCEL", "PUBLISH"]

@dataclass
class MailParams:
    subject: str
    summary: str
    description: str
    method: CalendarMethod  # ICS METHOD
    add_button: bool = True

def _load_ctx(db: Session, booking_id: int):
    bk: Booking | None = db.get(Booking, booking_id)
    if not bk:
        return None
    court: Court | None = db.get(Court, bk.court_id)
    venue: Venue | None = (db.get(Venue, court.venue_id) if court else None)
    player: User | None = db.get(User, bk.user_id)
    owner: User | None = (db.get(User, venue.owner_user_id) if venue and getattr(venue, "owner_user_id", None) else None)
    return bk, court, venue, player, owner

def _ensure_uid_sequence(db: Session, bk: Booking):
    # Inicializa UID si no existe; incrementa sequence para cada notificación
    if not getattr(bk, "ics_uid", None):
        bk.ics_uid = str(uuid4())
    bk.ics_sequence = (bk.ics_sequence or 0) + 1
    db.commit(); db.refresh(bk)

def _mail_params_for_transition(old: BookingStatusEnum, new: BookingStatusEnum) -> MailParams | None:
    # Definí asunto/ICS METHOD por transición de estado
    if old == BookingStatusEnum.PENDING and new == BookingStatusEnum.CONFIRMED:
        return MailParams(
            subject="✅ Tu reserva fue confirmada",
            summary="Reserva confirmada",
            description="Tu reserva fue confirmada por el establecimiento.",
            method="REQUEST",
        )
    if old == BookingStatusEnum.PENDING and new in (BookingStatusEnum.CANCELLED, BookingStatusEnum.CANCELLED_LATE):
        return MailParams(
            subject="❌ Tu reserva fue rechazada",
            summary="Reserva rechazada",
            description="El establecimiento rechazó tu reserva.",
            method="CANCEL",
        )
    if new == BookingStatusEnum.CANCELLED:
        return MailParams(
            subject="❌ Reserva cancelada",
            summary="Reserva cancelada",
            description="La reserva fue cancelada.",
            method="CANCEL",
        )
    if new == BookingStatusEnum.CANCELLED_LATE:
        return MailParams(
            subject="⚠️ Reserva cancelada fuera de plazo",
            summary="Cancelación fuera de plazo",
            description="La reserva fue cancelada fuera de plazo.",
            method="CANCEL",
        )

    return None

def notify_booking_state_change(booking_id: int, old_status: BookingStatusEnum, new_status: BookingStatusEnum) -> None:
    if old_status == new_status:
        return

    db: Session = SessionLocal()
    try:
        loaded = _load_ctx(db, booking_id)
        if not loaded:
            return
        bk, court, venue, player, owner = loaded

        params = _mail_params_for_transition(old_status, new_status)
        if not params:
            return

        _ensure_uid_sequence(db, bk)

        venue_name = getattr(venue, "name", f"Venue {venue.id if venue else ''}")
        court_name = getattr(court, "name", f"Court {court.id if court else ''}")
        price = float(bk.price_total or 0)
        player_name = getattr(player, "name", None) if player else None

        # ---------- ELEGIR TEMPLATE DEL JUGADOR SEGÚN new_status ----------
        if new_status == BookingStatusEnum.CONFIRMED:
            player_html = booking_html_player_confirmed(
                player_name=player_name,
                venue_name=venue_name,
                court_name=court_name,
                start=bk.start_datetime,
                end=bk.end_datetime,
                price=price,
            )
        elif new_status in (BookingStatusEnum.CANCELLED, BookingStatusEnum.CANCELLED_LATE):
            player_html = booking_html_player_cancelled(
                player_name=player_name,
                venue_name=venue_name,
                court_name=court_name,
                start=bk.start_datetime,
                end=bk.end_datetime,
                price=price,
                late=(new_status == BookingStatusEnum.CANCELLED_LATE),
            )
        elif old_status == BookingStatusEnum.PENDING and new_status == BookingStatusEnum.PENDING:
            # Rara vez sucederá, pero por completitud
            player_html = booking_html_player_pending(
                player_name=player_name,
                venue_name=venue_name,
                court_name=court_name,
                start=bk.start_datetime,
                end=bk.end_datetime,
                price=price,
            )
        else:
            # fallback razonable: si no matchea, mandá “pendiente”
            player_html = booking_html_player_pending(
                player_name=player_name,
                venue_name=venue_name,
                court_name=court_name,
                start=bk.start_datetime,
                end=bk.end_datetime,
                price=price,
            )

        owner_html = booking_html_for_owner(
            owner_name=getattr(owner, "name", None) if owner else None,
            player_email=(player.email if player else "-"),
            venue_name=venue_name,
            court_name=court_name,
            start=bk.start_datetime,
            end=bk.end_datetime,
            price=price,
        )

        subj_player = params.subject
        subj_owner = ("📩 " + params.subject) if params.method != "CANCEL" else "🔔 Cambio en una reserva"

        # ---------- ENVÍO (uno por uno) ----------
        for addr, html, subj in [
            (player.email if player and player.email else None, player_html, subj_player),
            (owner.email if owner and owner.email else None, owner_html, subj_owner),
        ]:
            if not addr:
                continue
            try:
                send_html_email_gmail(
                    to_owner=None,
                    to_player=addr,
                    html_body=html,
                    subject=subj,
                    summary=f"{venue_name} - {court_name}",
                    description=f"Reserva #{bk.id} - Estado: {new_status}",
                    location=getattr(venue, "address", venue_name) if venue else venue_name,
                    start_dt=bk.start_datetime,
                    end_dt=bk.end_datetime,
                    organizer_email=(owner.email if owner and owner.email else None),
                    # Si tu send_html_email_gmail todavía NO acepta method/uid/sequence,
                    # no los pases aún para evitar TypeError. Cuando lo actualices,
                    # agregá: method=params.method, sequence=bk.ics_sequence, uid=bk.ics_uid
                )
            except Exception as e:
                print(f"[notify_booking_state_change] {addr} -> {e}")

    finally:
        db.close()