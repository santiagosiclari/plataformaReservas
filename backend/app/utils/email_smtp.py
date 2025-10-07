# app/utils/email_smtp.py
import os, smtplib
from email.message import EmailMessage
from typing import Optional
from app.utils.calendar_ics import build_booking_ics, build_google_calendar_link
from uuid import uuid4

def _bool_env(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).lower() in ("1", "true", "yes", "y")

def send_html_email_gmail(to_owner: str | None,
    to_player: str | None,
    html_body: str,
    subject: str,
    summary: str,          # p.ej. "Reserva en {venue_name} - {court}"
    description: str,      # p.ej. "Reserva #{id} ..."
    location: str,         # p.ej. "Av. Siempreviva 742, CABA"
    start_dt, end_dt,      # datetimes aware o naïve -> se fuerzan a UTC
    organizer_email: str | None, method: str = "REQUEST", sequence: int = 0, uid: str | None = None):
    uid = uid or str(uuid4())
    ics_text = build_booking_ics(
        uid=uid,
        summary=summary,
        description=description,
        location=location,
        start_dt=start_dt,
        end_dt=end_dt,
        organizer_email=organizer_email,
        attendee_emails=[e for e in [to_owner, to_player] if e],
        method=method,
        sequence=sequence,
        status_line=("STATUS:CANCELLED" if method == "CANCEL" else None),
    )

    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASS = os.getenv("SMTP_PASS")
    EMAIL_FROM = os.getenv("EMAIL_FROM") or SMTP_USER

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

    # También podés incluir el botón a Google Calendar en el HTML:
    gcal_link = build_google_calendar_link(summary, description, location, start_dt, end_dt)
    html_with_button = html_body.replace(
        "</div>",
        f"""<p style="margin-top:16px">
              <a href="{gcal_link}"
                 style="display:inline-block;padding:10px 14px;border-radius:6px;
                        background:#1a73e8;color:#fff;text-decoration:none">
                 Agregar a Google Calendar
              </a>
            </p></div>"""
    )

    # armamos el mensaje y adjuntamos el .ics
    def _send(to_email: str):
        msg = EmailMessage()
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content("Tu cliente de correo no soporta HTML.")
        msg.add_alternative(html_with_button, subtype="html")

        # Adjuntar como .ics y como text/calendar (algunos clientes muestran botón nativo)
        msg.add_attachment(
            ics_text.encode("utf-8"),
            maintype="text",
            subtype="calendar",
            filename="reserva.ics",
            params={"method": "REQUEST", "name": "reserva.ics"},
        )

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            # si usás Mailpit local, no hagas TLS/login
            if os.getenv("SMTP_FORCE_TLS", "false").lower() in ("1","true","yes"):
                if "starttls" in server.esmtp_features:
                    server.starttls(); server.ehlo()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

    for addr in [to_player, to_owner]:
        if addr:
            try:
                _send(addr)
            except Exception as e:
                print(f"[email][send_booking_confirmation_with_ics] {addr} -> {e}")

def send_basic_html_email(to_email: str, subject: str, html_body: str):
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASS = os.getenv("SMTP_PASS")
    EMAIL_FROM = os.getenv("EMAIL_FROM") or SMTP_USER
    FORCE_TLS = os.getenv("SMTP_FORCE_TLS", "false").lower() in ("1","true","yes")

    msg = EmailMessage()
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content("Tu cliente de correo no soporta HTML.")
    msg.add_alternative(html_body, subtype="html")

    print(f"[MAIL] Connecting {SMTP_HOST}:{SMTP_PORT} as {SMTP_USER}, to={to_email}")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        if FORCE_TLS:
            # Fuerza STARTTLS sin chequear features (Gmail lo soporta)
            server.starttls()
            server.ehlo()
            print("[MAIL] STARTTLS ok")
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
            print("[MAIL] Login ok")
        server.send_message(msg)
        print(f"[MAIL] Sent to {to_email} subject='{subject}' OK")


def send_basic_html_email_safe(to_email: str | None, subject: str, html: str):
    if not to_email:
        print("[WARN] send_basic_html_email_safe: destinatario vacío; se omite envío")
        return
    try:
        send_basic_html_email(to_email, subject, html)
    except Exception as e:
        # logueá pero NO re-lances para que el background no rompa el request
        import traceback
        print("[ERROR] Email no enviado:", e)
        traceback.print_exc()
