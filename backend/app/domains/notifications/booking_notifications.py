# app/notifications/bookings.py
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.db import SessionLocal  # tu factory de sesiones
from app.domains.bookings.models import Booking
from app.domains.venues.models import Court, Venue
from app.domains.users.models import User
from app.utils.email_smtp import send_html_email_gmail
from app.utils.email_templates import booking_html_for_player, booking_html_for_owner

def _get(ctx: Session, model, id_):
    obj = ctx.get(model, id_)
    return obj

def notify_booking_created(booking_id: int) -> None:
    # cada tarea abre y cierra su sesión
    db: Session = SessionLocal()
    try:
        bk: Optional[Booking] = _get(db, Booking, booking_id)
        if not bk:
            return

        # Cargar relaciones necesarias
        court: Optional[Court] = _get(db, Court, bk.court_id)
        if not court:
            return
        venue: Optional[Venue] = _get(db, Venue, court.venue_id)
        if not venue:
            return

        player: Optional[User] = _get(db, User, bk.user_id)
        owner: Optional[User] = db.get(User, venue.owner_user_id) if getattr(venue, "owner_user_id", None) else None

        venue_name = getattr(venue, "name", f"Venue {venue.id}")
        court_name = getattr(court, "name", f"Court {court.id}")

        # 1) Mail al jugador
        if player and player.email:
            html = booking_html_for_player(
                player_name=getattr(player, "name", None),
                venue_name=venue_name,
                court_name=court_name,
                start=bk.start_datetime, 
                end=bk.end_datetime,
                price=float(bk.price_total or 0),
            )
            try:
                send_html_email_gmail(
                    to_email=player.email,
                    subject="✅ Tu reserva fue confirmada",
                    html=html,
                    reply_to=getattr(owner, "email", None) if owner else None
                )
            except Exception as e:
                # logueá, no interrumpas
                print(f"[notify_booking_created] Error enviando mail a jugador: {e}")

        # 2) Mail al owner
        if owner and owner.email:
            html = booking_html_for_owner(
                owner_name=getattr(owner, "name", None),
                player_email=(player.email if player else "-"),
                venue_name=venue_name,
                court_name=court_name,
                start=bk.start_datetime, 
                end=bk.end_datetime,
                price=float(bk.price_total or 0),
            )
            try:
                send_html_email_gmail(
                    to_email=owner.email,
                    subject="📩 Nueva reserva recibida",
                    html=html,
                    reply_to=(player.email if player else None)
                )
            except Exception as e:
                print(f"[notify_booking_created] Error enviando mail a owner: {e}")

    finally:
        db.close()
