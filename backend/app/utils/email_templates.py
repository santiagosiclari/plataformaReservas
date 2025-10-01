# app/utils/email_templates.py
from datetime import datetime

def booking_html_for_player(player_name: str, venue_name: str, court_name: str,
                            start: datetime, end: datetime, price: float) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2>¡Reserva confirmada!</h2>
      <p>Hola {player_name or "jugador/a"}, tu reserva fue confirmada.</p>
      <ul>
        <li><b>Sede:</b> {venue_name}</li>
        <li><b>Cancha:</b> {court_name}</li>
        <li><b>Inicio:</b> {start.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Fin:</b> {end.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Precio:</b> $ {price:,.0f} ARS</li>
      </ul>
      <p>¡Gracias por reservar!</p>
    </div>
    """

def booking_html_for_owner(owner_name: str, player_email: str, venue_name: str, court_name: str,
                           start: datetime, end: datetime, price: float) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2>Nueva reserva recibida</h2>
      <p>Hola {owner_name or "owner"}, se generó una nueva reserva.</p>
      <ul>
        <li><b>Sede:</b> {venue_name}</li>
        <li><b>Cancha:</b> {court_name}</li>
        <li><b>Cliente:</b> {player_email}</li>
        <li><b>Inicio:</b> {start.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Fin:</b> {end.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Precio:</b> $ {price:,.0f} ARS</li>
      </ul>
    </div>
    """
