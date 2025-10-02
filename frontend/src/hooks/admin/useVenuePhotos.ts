// src/hooks/admin/useVenuePhotos.ts
import { useEffect, useState, useCallback } from "react";
import {
  listVenuePhotos,
  createVenuePhoto,
  updateVenuePhoto,
  deleteVenuePhoto,
  type VenuePhoto,
} from "../../api/venues.api";

type CreateBody = { url: string; alt_text?: string | null; is_cover?: boolean; sort_order?: number };
type UpdateBody = Partial<VenuePhoto>;

export function useVenuePhotos(venueId: number | null) {
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!venueId) { setPhotos([]); return; }
    const p = await listVenuePhotos(venueId);
    // aseguramos orden
    setPhotos([...p].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
  }, [venueId]);

  useEffect(() => { reload().catch(console.error); }, [reload]);

  async function create(body: CreateBody) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try { await createVenuePhoto(venueId, body); await reload(); setMsg("Foto agregada ✔"); }
    catch (e: any) { setMsg(e?.message || "No se pudo agregar la foto"); }
    finally { setLoading(false); }
  }

  async function update(photoId: number, body: UpdateBody) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try { await updateVenuePhoto(venueId, photoId, body); await reload(); setMsg("Foto actualizada ✔"); }
    catch (e: any) { setMsg(e?.message || "No se pudo actualizar la foto"); }
    finally { setLoading(false); }
  }

  async function remove(photoId: number) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try { await deleteVenuePhoto(venueId, photoId); await reload(); setMsg("Foto eliminada ✔"); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar la foto"); }
    finally { setLoading(false); }
  }

  // helper: swap ↑/↓ (intercambia sort_order con el vecino)
  async function swap(photoId: number, dir: -1 | 1) {
    const idx = photos.findIndex(p => p.id === photoId);
    const otherIdx = idx + dir;
    if (idx < 0 || otherIdx < 0 || otherIdx >= photos.length) return;

    const a = photos[idx], b = photos[otherIdx];
    await update(a.id, { sort_order: b.sort_order });
    await update(b.id, { sort_order: a.sort_order });
  }

  // helper: marcar portada
  async function setCover(photoId: number) {
    await update(photoId, { is_cover: true });
  }

  return { photos, loading, msg, setMsg, reload, create, update, remove, swap, setCover };
}
