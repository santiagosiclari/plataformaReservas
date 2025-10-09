import { useEffect, useState } from "react";
import {
  listOwnedVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  type Venue,
  type VenueCreate,
} from "../../api/venues.api";

// 👇 Shape del formulario de alta/edición ligera (coincide con la UI)
export type FormVenueInput = {
  name: string;

  // Alta (address validation)
  country?: string;               // -> region_code (default "AR")
  streetAndNumber?: string;       // address_lines[0]
  optionalLine2?: string;         // address_lines[1] (opcional)
  city?: string | null;           // -> locality
  province?: string | null;       // -> administrative_area
  postalCode?: string | null;     // -> postal_code

  // Edit (opcional)
  lat?: number | null;            // si se editan coords manualmente
  lng?: number | null;
};

export function useOwnerVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const vs = await listOwnedVenues();
    setVenues(vs);
  }

  useEffect(() => { reload().catch(console.error); }, []);

  // Mapea FormVenueInput -> VenueCreate para el POST /venues
  function toVenueCreate(f: FormVenueInput): VenueCreate {
    return {
      name: f.name,
      region_code: f.country || "AR",
      address_lines: [f.streetAndNumber, f.optionalLine2].filter(Boolean) as string[],
      locality: f.city ?? null,
      administrative_area: f.province ?? null,
      postal_code: f.postalCode ?? null,
      latitude: f.lat ?? null,
      longitude: f.lng ?? null,
    };
  }

  async function create(form: FormVenueInput) {
    setLoading(true); setMsg(null);
    try {
      const created = await createVenue(toVenueCreate(form));
      await reload();
      return created;
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;
      if (status === 400 && detail) setMsg(detail); // dirección no validada
      else if (status === 502) setMsg("No pudimos validar la dirección con el servicio externo. Intentá de nuevo.");
      else setMsg(e?.message || "No se pudo crear la sede");
      return null;
    } finally { setLoading(false); }
  }

  // PATCH /venues/{id} — solo name/lat/lng por ahora
  async function update(id: number, form: Partial<FormVenueInput>) {
    setLoading(true); setMsg(null);
    try {
      const body: { name?: string; latitude?: number | null; longitude?: number | null } = {};
      if (typeof form.name !== "undefined") body.name = form.name;
      // si uno de lat/lng viene, exigimos ambos (regla del backend)
      const latProvided = typeof form.lat !== "undefined";
      const lngProvided = typeof form.lng !== "undefined";
      if (latProvided || lngProvided) {
        body.latitude = form.lat ?? null;
        body.longitude = form.lng ?? null;
      }
      await updateVenue(id, body);
      await reload();
    } catch (e: any) {
      setMsg(e?.message || "No se pudo actualizar la sede");
    } finally { setLoading(false); }
  }

  async function remove(id: number) {
    setLoading(true); setMsg(null);
    try { await deleteVenue(id); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar la sede"); }
    finally { setLoading(false); }
  }

  return { venues, loading, msg, setMsg, create, update, remove, reload };
}
