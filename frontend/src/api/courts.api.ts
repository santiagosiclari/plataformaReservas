// Courts API client aligned to your FastAPI router
// - Owner/venue-scoped (CRUD): /venues/{venue_id}/courts
// - Public read/search:       /courts, /courts/{id}, /courts/search, /courts/{id}/availability

import http from "./http";

// ---------------------------------
// Types (owner CRUD / base court)
// ---------------------------------
export type Sport = "FOOTBALL" | "TENNIS" | "PADEL" | "BASKET" | "VOLLEY";

export interface Court {
  id: number;
  venue_id: number;
  sport: Sport;
  surface?: string | null;
  indoor: boolean;
  number?: string | null; // business identifier/label, not the PK
  notes?: string | null;
}

export interface CreateCourtDTO {
  sport: Sport;
  surface?: string | null;
  indoor?: boolean; // default false on backend
  number?: string | null;
  notes?: string | null;
}

export interface UpdateCourtDTO {
  sport?: Sport;
  surface?: string | null;
  indoor?: boolean;
  number?: string | null;
  notes?: string | null;
}

export interface ListCourtsParams {
  sport?: Sport | string;
  indoor?: boolean;
}

// ---------------------------------
// Venue-scoped endpoints (canonical)
// ---------------------------------
export async function listCourts(venueId: number, params: ListCourtsParams = {}): Promise<Court[]> {
  const { data } = await http.get(`/venues/${venueId}/courts`, { params });
  return data as Court[];
}

export const listCourtsByVenue = listCourts;

export async function getCourt(venueId: number, courtId: number): Promise<Court> {
  const { data } = await http.get(`/venues/${venueId}/courts/${courtId}`);
  return data as Court;
}

export async function createCourt(venueId: number, body: CreateCourtDTO): Promise<Court> {
  const { data } = await http.post(`/venues/${venueId}/courts`, body);
  return data as Court;
}

export async function updateCourt(
  venueId: number,
  courtId: number,
  body: UpdateCourtDTO
): Promise<Court> {
  const { data } = await http.put(`/venues/${venueId}/courts/${courtId}`, body);
  return data as Court;
}

export async function deleteCourt(venueId: number, courtId: number): Promise<void> {
  await http.delete(`/venues/${venueId}/courts/${courtId}`);
}

// ---------------------------------
// Optional: flat court endpoints if you expose /courts
// (estos eran genéricos; los dejamos y añadimos tipos públicos específicos abajo)
// ---------------------------------
export const flat = {
  list: async (): Promise<Court[]> => {
    const { data } = await http.get(`/courts`);
    return data as Court[];
  },
  get: async (courtId: number): Promise<Court> => {
    const { data } = await http.get(`/courts/${courtId}`);
    return data as Court;
  },
};

// ---------------------------------
// Helpers
// ---------------------------------
export const SPORT_LABEL: Record<Sport, string> = {
  FOOTBALL: "Fútbol",
  TENNIS: "Tenis",
  PADEL: "Pádel",
  BASKET: "Básquet",
  VOLLEY: "Vóley",
};

// =================================
// 🔽 NUEVO: endpoints públicos p/ Search y Detail
// =================================

// Detalle público devuelto por /courts/{id} (router público)
export type CourtDetailPublic = {
  id: number;
  venue_id: number;
  venue_name: string;
  court_name: string; // "Cancha 2", etc.
  sport: Sport | string;         // backend puede devolver string
  surface?: string | null;
  indoor?: boolean;
  venue_latitude?: number | null;
  venue_longitude?: number | null;
  address?: string | null;
};

// Disponibilidad /courts/{id}/availability
export type AvailabilitySlot = {
  start: string;        // ISO
  end: string;          // ISO
  available: boolean;
  price_per_slot?: number | null;
  currency?: string | null;
};

export type AvailabilityResponse = {
  court_id: number;
  date: string;          // "YYYY-MM-DD"
  slot_minutes: number | null;
  slots: AvailabilitySlot[];
};

// Búsqueda pública /courts/search
export type CourtSearchResult = {
  id: number;
  venue_id: number;
  venue_name: string;
  court_name: string;
  sport: string;
  surface?: string;
  indoor?: boolean;
  lat?: number;
  lng?: number;
  distance_km?: number;
  price_hint?: number;
  photo_url?: string;
  address?: string;
};

export type SearchCourtsParams = {
  q?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  sport?: string;
  limit?: number;
};

// ---- funciones públicas ----
export async function getCourtPublic(courtId: number): Promise<CourtDetailPublic> {
  const { data } = await http.get<CourtDetailPublic>(`/venues/courts/${courtId}`);
  return data;
}

export async function getAvailabilityPublic(
  courtId: number,
  date: string
): Promise<AvailabilityResponse> {
  const { data } = await http.get<AvailabilityResponse>(`/courts/${courtId}/availability`, {
    params: { date },
  });
  return data;
}

export async function searchCourtsPublic(params: SearchCourtsParams) {
  const { data } = await http.get<CourtSearchResult[]>(`/venues/courts/search`, { params });
  return data;
}
