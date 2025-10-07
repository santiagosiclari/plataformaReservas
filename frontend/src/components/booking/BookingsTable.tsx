import React from "react";
import type { Booking } from "../../api/bookings.api";
import StatusBadge from "./StatusBadge";
import Countdown from "./Countdown";
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Typography
} from "@mui/material";

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
  const hasExpiry = b.expires_at != null;
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
  ActionsCell: React.ComponentType<{
    booking: Booking;
    tab: "mine" | "owner";
    canOwner: boolean;
    expired: boolean;
    onConfirm: (id: number) => void;
    onDecline: (id: number) => void;
    onCancel: (id: number) => void;
  }>;
}) {
  return (
    <Table size="medium" sx={{ "& th, & td": { py: 1, borderColor: "divider" } }}>
      <TableHead>
        <TableRow>
          <TableCell>#</TableCell>
          <TableCell>Court</TableCell>
          <TableCell>Inicio</TableCell>
          <TableCell>Fin</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Vencimiento</TableCell>
          <TableCell align="right">Precio</TableCell>
          {(tab === "mine" || canOwner) && <TableCell align="right">Acciones</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((b) => {
          const pending = b.status === "PENDING";
          const hasExpiry = b.expires_at != null;
          const isExpired = expiredOf(b);

          return (
            <TableRow key={b.id} hover>
              <TableCell>#{b.id}</TableCell>
              <TableCell>Court {b.court_id}</TableCell>
              <TableCell>{fmt(b.start_datetime)}</TableCell>
              <TableCell>{fmt(b.end_datetime)}</TableCell>
              <TableCell><StatusBadge status={b.status} /></TableCell>
              <TableCell>
                {pending ? (hasExpiry ? <Countdown expiresAt={b.expires_at} /> : <Typography color="text.secondary">—</Typography>) : <Typography color="text.secondary">—</Typography>}
              </TableCell>
              <TableCell align="right">{money(b.price_total)}</TableCell>

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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
