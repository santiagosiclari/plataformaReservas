import { useEffect, useState } from "react";
import { listCourtsByVenue, createCourt, updateCourt, deleteCourt } from "../../api/courts.api";
import type { Court, CreateCourtDTO, UpdateCourtDTO } from "../../components/admin";

export function useVenueCourts(venueId: number | null) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    if (!venueId) { setCourts([]); return; }
    const cs = await listCourtsByVenue(venueId);
    setCourts(cs);
  }
  useEffect(() => { reload().catch(console.error); }, [venueId]);

  async function create(c: CreateCourtDTO) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try { await createCourt(venueId, c); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo crear la cancha"); }
    finally { setLoading(false); }
  }

  async function update(courtId: number, c: UpdateCourtDTO) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try { await updateCourt(venueId, courtId, c); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo actualizar la cancha"); }
    finally { setLoading(false); }
  }

  async function remove(courtId: number) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try { await deleteCourt(venueId, courtId); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar la cancha"); }
    finally { setLoading(false); }
  }

  return { courts, loading, msg, setMsg, create, update, remove, reload };
}
