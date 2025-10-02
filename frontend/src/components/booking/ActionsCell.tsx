import React from "react";
import type { Booking } from "../../api/bookings.api";
import { Link } from "react-router-dom";
import type { CourtDetailPublic } from "../../api/courts.api";

export default function ActionsCell({
  booking, tab, canOwner, expired,
  onConfirm, onDecline, onCancel,
}: {
  booking: Booking;
  tab: "mine" | "owner";
  canOwner: boolean;
  expired: boolean;
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
  onCancel: (id: number) => void;
}) {
  const pending = booking.status === "PENDING";

  return (
    <td style={{ padding: 8, textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      {/* PLAYER: cancelar */}
      {tab === "mine" && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <button className="btn" onClick={() => onCancel(booking.id)}>Cancelar</button>
      )}
      {/* OWNER: confirmar / rechazar sólo si PENDING y no vencida */}
      {tab === "owner" && canOwner && pending && !expired && (
        <>
          <button className="btn-primary" onClick={() => onConfirm(booking.id)}>Confirmar</button>
          <button className="btn" onClick={() => onDecline(booking.id)}>Rechazar</button>
        </>
      )}
      {tab === "owner" && canOwner && pending && expired && (
        <span className="muted">Vencida</span>
      )}
    </td>
  );
}

export const Actions: React.FC<{
    court: CourtDetailPublic;
    date: string;
    disabled: boolean;
    onConfirm: () => void;
    submitting: boolean;
    }> = ({ court, date, disabled, onConfirm, submitting }) => (
    <div className="actions">
    <Link className="btn" to={`/courts/${court.id}?date=${date}`}>Cambiar horarios</Link>
    <button className="btn-primary" onClick={onConfirm} disabled={disabled}>
    {submitting ? "Confirmando..." : "Confirmar reserva"}
    </button>
    </div>
    );