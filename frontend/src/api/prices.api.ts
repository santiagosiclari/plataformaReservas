// src/api/prices.api.ts
import http from "./http";

/** 0 = Lunes … 6 = Domingo (según tu schema: "0=lun .. 6=dom") */
export interface Price {
  id: number;
  court_id: number;
  weekday: number;        // 0..6
  start_time: string;     // "HH:MM"
  end_time: string;       // "HH:MM"
  price_per_slot: number; // ARS
}

export interface CreatePriceDTO {
  weekday: number;            // 0..6
  start_time: string;         // "HH:MM"
  end_time: string;           // "HH:MM"
  price_per_slot: number | string;
}

export interface UpdatePriceDTO {
  weekday?: number;
  start_time?: string;
  end_time?: string;
  price_per_slot?: number | string;
}

// Rutas anidadas por venue/court (ajustá si tu backend usa top-level /prices)
const basePath = (venueId: number, courtId: number) =>
  `/venues/${venueId}/courts/${courtId}/prices`;

function normalize(p: any): Price {
  return {
    id: Number(p.id),
    court_id: Number(p.court_id),
    weekday: Number(p.weekday),
    start_time: String(p.start_time), // el back devuelve "HH:MM:SS" a veces; si querés, recortá a 5 chars
    end_time: String(p.end_time),
    price_per_slot: typeof p.price_per_slot === "string"
      ? Number(p.price_per_slot)
      : Number(p.price_per_slot),
  };
}

/** Lista precios de una cancha */
export async function listPrices(venueId: number, courtId: number): Promise<Price[]> {
  const { data } = await http.get(basePath(venueId, courtId));
  return Array.isArray(data) ? data.map(normalize) : [];
}

/** Crea un precio */
export async function createPrice(
  venueId: number,
  courtId: number,
  body: CreatePriceDTO
): Promise<Price> {
  const payload = { ...body, court_id: courtId };
  (payload as any).price_per_slot = Number(payload.price_per_slot);

  const { data } = await http.post(basePath(venueId, courtId), payload);
  return normalize(data);
}

/** Actualiza un precio */
export async function updatePrice(
  venueId: number,
  courtId: number,
  priceId: number,
  body: UpdatePriceDTO
): Promise<Price> {
  const payload = { ...body, court_id: courtId };
  if (payload.price_per_slot != null) {
    (payload as any).price_per_slot = Number(payload.price_per_slot);
  }

  const { data } = await http.patch(`${basePath(venueId, courtId)}/${priceId}`, payload);
  return normalize(data);
}

/** Elimina un precio */
export async function deletePrice(
  venueId: number,
  courtId: number,
  priceId: number
): Promise<void> {
  await http.delete(`${basePath(venueId, courtId)}/${priceId}`);
}
