import React from "react";
import StatusBadge from "./StatusBadge";
import Countdown from "./Countdown";
import type { Booking } from "../../api/bookings.api";

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}
function money(v: number | string | null | undefined) {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
function expiredOf(b: Booking): boolean {
  const pending = b.status === "PENDING";
  const hasExpiry = b.expires_at !== null && b.expires_at !== undefined;
  const left = hasExpiry ? (new Date(b.expires_at!).getTime() - Date.now()) : Infinity;
  return pending && hasExpiry && left <= 0;
}

export default function BookingsTable({
  rows, tab, canOwner,
  onConfirm, onDecline, onCancel,
  ActionsCell,
}: {
  rows: Booking[];
  tab: "mine" | "owner";
  canOwner: boolean;
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
  onCancel: (id: number) => void;
  ActionsCell: React.ComponentType<React.ComponentProps<any>>;
}) {
  return (
    <table className="table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>#</th>
          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>Court</th>
          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>Inicio</th>
          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>Fin</th>
          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>Estado</th>
          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border)" }}>Vencimiento</th>
          <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid var(--border)" }}>Precio</th>
          {(tab === "mine" || canOwner) && (
            <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid var(--border)" }}>Acciones</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => {
          const pending = b.status === "PENDING";
          const hasExpiry = b.expires_at !== null && b.expires_at !== undefined;
          const isExpired = expiredOf(b);

          return (
            <tr key={b.id}>
              <td style={{ padding: 8 }}>#{b.id}</td>
              <td style={{ padding: 8 }}>Court {b.court_id}</td>
              <td style={{ padding: 8 }}>{fmt(b.start_datetime)}</td>
              <td style={{ padding: 8 }}>{fmt(b.end_datetime)}</td>
              <td style={{ padding: 8 }}><StatusBadge status={b.status} /></td>
              <td style={{ padding: 8 }}>
                {pending ? (hasExpiry ? <Countdown expiresAt={b.expires_at} /> : <span className="muted">—</span>) : <span className="muted">—</span>}
              </td>
              <td style={{ padding: 8, textAlign: "right" }}>{money(b.price_total)}</td>

              {/* Actions */}
              {(tab === "mine" || canOwner) && (
                <ActionsCell
                  booking={b}
                  tab={tab}
                  canOwner={canOwner}
                  expired={isExpired}
                  onConfirm={onConfirm}
                  onDecline={onDecline}
                  onCancel={onCancel}
                />
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
