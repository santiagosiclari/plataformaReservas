import { useEffect, useState } from "react";
import { getCourtPublic, getAvailabilityPublic, type CourtDetailPublic, type AvailabilitySlot } from "../../api/courts.api";


export function useCourtAndSlots(courtId?: number, date?: string) {
const [court, setCourt] = useState<CourtDetailPublic | null>(null);
const [daySlots, setDaySlots] = useState<AvailabilitySlot[]>([]);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState<string | null>(null);


useEffect(() => {
let cancelled = false;
async function load() {
if (!courtId || !date) {
setErr("Faltan parámetros de la reserva.");
setLoading(false);
return;
}
setLoading(true);
setErr(null);
try {
const c = await getCourtPublic(courtId);
if (!cancelled) setCourt(c);
const a = await getAvailabilityPublic(courtId, date);
if (!cancelled) setDaySlots(a.slots);
} catch (e) {
console.error(e);
if (!cancelled) setErr("No se pudo cargar la información para reservar.");
} finally {
if (!cancelled) setLoading(false);
}
}
load();
return () => { cancelled = true; };
}, [courtId, date]);


return { court, daySlots, loading, err, setErr } as const;
}