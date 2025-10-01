# app/notifications/calendar_sender.py
import os, smtplib
from email.message import EmailMessage
from typing import Optional
from uuid import uuid4
from app.utils.calendar_ics import build_booking_ics, build_google_calendar_link

def _true(v: str | None, default="true") -> bool:
    return (v or default).lower() in ("1","true","yes","y")

def send_booking_confirmation_with_ics(
    to_owner: Optional[str],
    to_player: Optional[str],
    html_body: str,
    subject: str,
    summary: str,
    description: str,
    location: str,
    start_dt,
    end_dt,
    organizer_email: Optional[str],
) -> None:
    SMTP_HOST  = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT  = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER  = os.getenv("SMTP_USER")
    SMTP_PASS  = os.getenv("SMTP_PASS")
    EMAIL_FROM = os.getenv("EMAIL_FROM") or SMTP_USER
    FORCE_TLS  = _true(os.getenv("SMTP_FORCE_TLS"), "true")
    FORCE_AUTH = _true(os.getenv("SMTP_FORCE_AUTH"), "true")

    uid = str(uuid4())
    ics_text = build_booking_ics(
        uid=uid,
        summary=summary,
        description=description,
        location=location,
        start_dt=start_dt,
        end_dt=end_dt,
        organizer_email=organizer_email,
        attendee_emails=[e for e in [to_owner, to_player] if e],
    )

    gcal_link = build_google_calendar_link(summary, description, location, start_dt, end_dt)
    html_with_button = html_body.replace(
        "</div>",
        f"""<p style="margin-top:16px">
              <a href="{gcal_link}" 
                 style="display:inline-block;padding:10px 14px;border-radius:6px;background:#1a73e8;color:#fff;text-decoration:none">
                 Agregar a Google Calendar
              </a>
            </p></div>"""
    )

    def _send(to_email: str):
        msg = EmailMessage()
        msg["From"] = EMAIL_FROM or "no-reply@example.com"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content("Tu cliente de correo no soporta HTML.")
        msg.add_alternative(html_with_button, subtype="html")

        msg.add_attachment(
            ics_text.encode("utf-8"),
            maintype="text",
            subtype="calendar",
            filename="reserva.ics",
            params={"method": "REQUEST", "name": "reserva.ics"},
        )

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            if FORCE_TLS and "starttls" in server.esmtp_features:
                server.starttls(); server.ehlo()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            elif FORCE_AUTH:
                raise RuntimeError("Faltan credenciales SMTP_USER / SMTP_PASS")
            server.send_message(msg)

    for addr in [to_player, to_owner]:
        if addr:
            try:
                _send(addr)
            except Exception as e:
                print(f"[email][calendar_sender] {addr} -> {e}")
