// src/hooks/admin/useCourtPhotos.ts
import { useEffect, useState, useCallback } from "react";
import {
  listCourtPhotos,
  createCourtPhoto,
  updateCourtPhoto,
  deleteCourtPhoto,
  type CourtPhoto,
} from "../../api/courts.api";

type CreateBody = { url: string; alt_text?: string | null; is_cover?: boolean; sort_order?: number };
type UpdateBody = Partial<CourtPhoto>;

export function useCourtPhotos(venueId: number | null, courtId: number | null) {
  const [photos, setPhotos] = useState<CourtPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!venueId || !courtId) { setPhotos([]); return; }
    const p = await listCourtPhotos(venueId, courtId);
    setPhotos([...p].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
  }, [venueId, courtId]);

  useEffect(() => { reload().catch(console.error); }, [reload]);

  async function create(body: CreateBody) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try { await createCourtPhoto(venueId, courtId, body); await reload(); setMsg("Foto agregada ✔"); }
    catch (e: any) { setMsg(e?.message || "No se pudo agregar la foto"); }
    finally { setLoading(false); }
  }

  async function update(photoId: number, body: UpdateBody) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try { await updateCourtPhoto(venueId, courtId, photoId, body); await reload(); setMsg("Foto actualizada ✔"); }
    catch (e: any) { setMsg(e?.message || "No se pudo actualizar la foto"); }
    finally { setLoading(false); }
  }

  async function remove(photoId: number) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try { await deleteCourtPhoto(venueId, courtId, photoId); await reload(); setMsg("Foto eliminada ✔"); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar la foto"); }
    finally { setLoading(false); }
  }

  async function swap(photoId: number, dir: -1 | 1) {
    const idx = photos.findIndex(p => p.id === photoId);
    const otherIdx = idx + dir;
    if (idx < 0 || otherIdx < 0 || otherIdx >= photos.length) return;

    const a = photos[idx], b = photos[otherIdx];
    await update(a.id, { sort_order: b.sort_order });
    await update(b.id, { sort_order: a.sort_order });
  }

  async function setCover(photoId: number) {
    await update(photoId, { is_cover: true });
  }

  return { photos, loading, msg, setMsg, reload, create, update, remove, swap, setCover };
}
