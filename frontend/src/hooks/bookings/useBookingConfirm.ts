import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../../api/bookings.api";
import { isAuthenticated } from "../../api/auth.api";
import type { CourtDetailPublic } from "../../api/courts.api";
import type { SelectionInfo } from "./useSelection";


export function useBookingConfirm(court: CourtDetailPublic | null, selection: SelectionInfo | null) {
const navigate = useNavigate();
const location = useLocation();
const [submitting, setSubmitting] = useState(false);
const [err, setErr] = useState<string | null>(null);


async function handleConfirm() {
if (!court || !selection) return;


if (!isAuthenticated()) {
navigate("/login", { state: { from: location.pathname + location.search } });
return;
}


setSubmitting(true);
setErr(null);
try {
const booking = await createBooking({
court_id: court.id,
start_datetime: selection.start,
end_datetime: selection.end,
});
navigate(`/booking/confirmation/${booking.id}`);
} catch (e: any) {
console.error(e);
const status = e?.response?.status;
if (status === 409) setErr("Esa franja fue tomada por otro usuario. Elegí otra.");
else if (status === 401) setErr("Tenés que iniciar sesión para confirmar.");
else setErr("No se pudo crear la reserva. Probá nuevamente.");
} finally {
setSubmitting(false);
}
}


return { handleConfirm, submitting, err, setErr } as const;
}