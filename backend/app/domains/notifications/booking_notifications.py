from app.utils.email_smtp import send_html_email_gmail
from app.utils.email_templates import booking_confirmed_html

def notify_booking_confirmed(owner_email, player_email, venue_name, court_label,
                             start_dt, end_dt, price_total, booking_id, venue_address=None):
    subject = "Tu reserva fue confirmada ✅"
    html = booking_confirmed_html(venue_name, court_label, start_dt, end_dt, price_total, booking_id, venue_address)
    try:
        send_html_email_gmail(owner_email, subject, html)
    except Exception as e:
        print(f"[email][owner] error: {e}")
    if player_email != owner_email:
        try:
            send_html_email_gmail(player_email, subject, html)
        except Exception as e:
            print(f"[email][player] error: {e}")
