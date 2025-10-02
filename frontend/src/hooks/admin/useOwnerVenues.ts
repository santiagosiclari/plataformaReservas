import { useEffect, useState } from "react";
import { listOwnedVenues, createVenue, updateVenue, deleteVenue } from "../../api/venues.api";
import type { Venue, VenueCreate, VenueUpdate } from "../../components/admin";

export function useOwnerVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const vs = await listOwnedVenues();
    setVenues(vs);
  }

  useEffect(() => { reload().catch(console.error); }, []);

  async function create(v: VenueCreate) {
    setLoading(true); setMsg(null);
    try { const created = await createVenue(v); await reload(); return created; }
    catch (e: any) { setMsg(e?.message || "No se pudo crear la sede"); }
    finally { setLoading(false); }
  }

  async function update(id: number, v: VenueUpdate) {
    setLoading(true); setMsg(null);
    try { await updateVenue(id, v); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo actualizar la sede"); }
    finally { setLoading(false); }
  }

  async function remove(id: number) {
    setLoading(true); setMsg(null);
    try { await deleteVenue(id); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar la sede"); }
    finally { setLoading(false); }
  }

  return { venues, loading, msg, setMsg, create, update, remove, reload };
}
