# app/utils/email_templates.py
from datetime import datetime

def booking_html_player_pending(player_name: str | None, venue_name: str, court_name: str,
                                start: datetime, end: datetime, price: float) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2>Reserva pendiente de confirmación</h2>
      <p>Hola {player_name or "jugador/a"}, tu reserva fue creada y el dueño debe confirmarla.</p>
      <ul>
        <li><b>Sede:</b> {venue_name}</li>
        <li><b>Cancha:</b> {court_name}</li>
        <li><b>Inicio:</b> {start.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Fin:</b> {end.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Precio:</b> $ {price:,.0f} ARS</li>
      </ul>
    </div>
    """

def booking_html_player_confirmed(player_name: str | None, venue_name: str, court_name: str,
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

def booking_html_player_cancelled(player_name: str | None, venue_name: str, court_name: str,
                                  start: datetime, end: datetime, price: float, late: bool = False) -> str:
    title = "Reserva cancelada" if not late else "Reserva cancelada fuera de plazo"
    note = "" if not late else "<p><b>Atención:</b> la cancelación fue fuera de plazo.</p>"
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2>{title}</h2>
      <p>Hola {player_name or "jugador/a"}, tu reserva fue cancelada.</p>
      {note}
      <ul>
        <li><b>Sede:</b> {venue_name}</li>
        <li><b>Cancha:</b> {court_name}</li>
        <li><b>Inicio:</b> {start.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Fin:</b> {end.strftime("%d/%m/%Y %H:%M")}</li>
        <li><b>Precio:</b> $ {price:,.0f} ARS</li>
      </ul>
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

def role_request_html(admin_name: str,
                      requester_name: str,
                      requester_email: str,
                      role: str,
                      approve_url: str,
                      reject_url: str) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2>Solicitud de rol {role}</h2>
      <p>Hola {admin_name},</p>
      <p>El usuario <b>{requester_name or requester_email}</b> ({requester_email}) solicitó el rol <b>{role}</b>.</p>
      <p>Acciones:</p>
      <p>
        <a href="{approve_url}" style="display:inline-block;padding:10px 14px;border-radius:6px;background:#16a34a;color:#fff;text-decoration:none">Aprobar</a>
        &nbsp;&nbsp;
        <a href="{reject_url}"  style="display:inline-block;padding:10px 14px;border-radius:6px;background:#b91c1c;color:#fff;text-decoration:none">Rechazar</a>
      </p>
      <p style="color:#64748b;font-size:12px;margin-top:12px">
        Si no pediste este mail, podés ignorarlo.
      </p>
    </div>
    """

def role_request_approved_html(user_name: str | None, role: str) -> str:
    """Correo para notificar al usuario que su solicitud fue aprobada."""
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2 style="color:#16a34a;">¡Tu solicitud fue aprobada!</h2>
      <p>Hola {user_name or "usuario/a"},</p>
      <p>Nos alegra informarte que tu solicitud para obtener el rol <b>{role}</b> ha sido aprobada exitosamente.</p>
      <p>Ya podés acceder a las funciones correspondientes desde tu cuenta y comenzar a usar las herramientas de gestión.</p>
      <p style="margin-top:12px;">¡Gracias por ser parte de <b>Plataforma Reservas</b> 💪!</p>
      <p style="color:#64748b;font-size:12px;margin-top:12px">Este correo se genera automáticamente, por favor no respondas.</p>
    </div>
    """


def role_request_rejected_html(user_name: str | None, role: str) -> str:
    """Correo para notificar al usuario que su solicitud fue rechazada."""
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
      <h2 style="color:#b91c1c;">Tu solicitud fue rechazada</h2>
      <p>Hola {user_name or "usuario/a"},</p>
      <p>Lamentablemente, tu solicitud para obtener el rol <b>{role}</b> no fue aprobada en esta ocasión.</p>
      <p>Si creés que se trata de un error o querés volver a solicitarlo, podés hacerlo más adelante desde tu perfil.</p>
      <p style="margin-top:12px;">Gracias por tu comprensión 🙏</p>
      <p style="color:#64748b;font-size:12px;margin-top:12px">Este correo se genera automáticamente, por favor no respondas.</p>
    </div>
    """