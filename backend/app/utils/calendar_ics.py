# app/utils/calendar_ics.py
from datetime import datetime, timezone
from uuid import uuid4
from urllib.parse import quote

def to_utc(dt: datetime) -> datetime:
    # asegura aware; convertí a UTC
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def ics_datetime(dt: datetime) -> str:
    # 20251005T180000Z
    dt = to_utc(dt)
    return dt.strftime("%Y%m%dT%H%M%SZ")

def build_booking_ics(
    uid: str,
    summary: str,
    description: str,
    location: str,
    start_dt: datetime,
    end_dt: datetime,
    organizer_email: str | None,
    attendee_emails: list[str],
) -> str:
    dtstamp = ics_datetime(datetime.now(timezone.utc))
    dtstart = ics_datetime(start_dt)
    dtend   = ics_datetime(end_dt)

    # Campos opcionales
    organizer = f"ORGANIZER:mailto:{organizer_email}\r\n" if organizer_email else ""
    attendees = "".join([f"ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:{e}\r\n" for e in attendee_emails if e])

    return (
        "BEGIN:VCALENDAR\r\n"
        "PRODID:-//ProyectoReserva//ES\r\n"
        "VERSION:2.0\r\n"
        "CALSCALE:GREGORIAN\r\n"
        "METHOD:REQUEST\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:{uid}\r\n"
        f"DTSTAMP:{dtstamp}\r\n"
        f"DTSTART:{dtstart}\r\n"
        f"DTEND:{dtend}\r\n"
        f"SUMMARY:{summary}\r\n"
        f"DESCRIPTION:{description}\r\n"
        f"LOCATION:{location}\r\n"
        f"{organizer}"
        f"{attendees}"
        # Recordatorio 30 minutos antes
        "BEGIN:VALARM\r\n"
        "TRIGGER:-PT30M\r\n"
        "ACTION:DISPLAY\r\n"
        "DESCRIPTION:Recordatorio de reserva\r\n"
        "END:VALARM\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )

def build_google_calendar_link(summary: str, description: str, location: str, start_dt: datetime, end_dt: datetime) -> str:
    # Google espera UTC en formato YYYYMMDDTHHMMSSZ
    st = ics_datetime(start_dt)
    en = ics_datetime(end_dt)
    return (
        "https://calendar.google.com/calendar/render"
        f"?action=TEMPLATE&text={quote(summary)}"
        f"&details={quote(description)}"
        f"&location={quote(location)}"
        f"&dates={st}/{en}"
    )
