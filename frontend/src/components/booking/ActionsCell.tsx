import React from "react";
import type { Booking } from "../../api/bookings.api";
import { Link as RouterLink } from "react-router-dom";
import type { CourtDetailPublic } from "../../api/courts.api";
import { TableCell, Stack, Button, Link } from "@mui/material";

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
    <TableCell align="right">
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {/* PLAYER: cancelar */}
        {tab === "mine" && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <Button variant="outlined" color="inherit" onClick={() => onCancel(booking.id)}>
            Cancelar
          </Button>
        )}

        {/* OWNER: confirmar / rechazar */}
        {tab === "owner" && canOwner && pending && !expired && (
          <>
            <Button variant="contained" onClick={() => onConfirm(booking.id)}>
              Confirmar
            </Button>
            <Button variant="outlined" color="inherit" onClick={() => onDecline(booking.id)}>
              Rechazar
            </Button>
          </>
        )}

        {tab === "owner" && canOwner && pending && expired && (
          <Button variant="text" color="inherit" disabled>Vencida</Button>
        )}
      </Stack>
    </TableCell>
  );
}

/* Botonera usada en la pantalla de confirmación de reserva */
export const Actions: React.FC<{
  court: CourtDetailPublic;
  date: string;
  disabled: boolean;
  onConfirm: () => void;
  submitting: boolean;
}> = ({ court, date, disabled, onConfirm, submitting }) => (
  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
    <Button
      component={RouterLink}
      to={`/courts/${court.id}?date=${date}`}
      variant="outlined"
      color="inherit"
    >
      Cambiar horarios
    </Button>
    <Button
      variant="contained"
      onClick={onConfirm}
      disabled={disabled}
    >
      {submitting ? "Confirmando..." : "Confirmar reserva"}
    </Button>
  </Stack>
);
