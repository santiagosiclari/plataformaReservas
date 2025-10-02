import { useEffect, useState } from "react";
import { listPrices, createPrice, updatePrice, deletePrice } from "../../api/prices.api";
import type { Price, CreatePriceDTO, UpdatePriceDTO } from "../../components/admin";

export function useCourtPrices(venueId: number | null, courtId: number | null) {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    if (!venueId || !courtId) { setPrices([]); return; }
    const ps = await listPrices(venueId, courtId);
    setPrices(ps);
  }
  useEffect(() => { reload().catch(console.error); }, [venueId, courtId]);

  async function create(p: CreatePriceDTO) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try { await createPrice(venueId, courtId, p); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo crear el precio"); }
    finally { setLoading(false); }
  }

  async function update(priceId: number, p: UpdatePriceDTO) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try { await updatePrice(venueId, courtId, priceId, p); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo actualizar el precio"); }
    finally { setLoading(false); }
  }

  async function remove(priceId: number) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try { await deletePrice(venueId, courtId, priceId); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar el precio"); }
    finally { setLoading(false); }
  }

  return { prices, loading, msg, setMsg, create, update, remove, reload };
}
