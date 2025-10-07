// src/api/venues.api.ts
import type { AxiosResponse } from "axios";
import http from "./http";
import type { Sport } from "./courts.api"; // reutilizamos el tipo ya definido en courts.api

export interface VenuePhoto {
  id: number;
  venue_id: number;
  url: string;
  is_cover: boolean;
  sort_order: number;
  alt_text?: string | null;
}

export type VenuePhotoCreate = {
  url: string;
  alt_text?: string | null;
  is_cover?: boolean;
  sort_order?: number;
};

export type VenuePhotoUpdate = Partial<Omit<VenuePhoto, "id" | "venue_id" | "url">> & {
  url?: string;
};

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  owner_user_id: number;
  created_at: string;
  courts?: CourtSummary[];
  photos?: VenuePhoto[];
}

export interface CourtSummary {
  id: number;
  venue_id: number;
  sport: Sport;
  surface?: string | null;
  indoor: boolean;
  number?: string | null;
  notes?: string | null;
}

export interface ListVenuesParams {
  q?: string;
  sport?: Sport | string;
  city?: string;
  page?: number;
  page_size?: number;
  owned?: 0 | 1; // 👈 para filtrar por dueño
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

function normalizePaginated<T>(data: any, fallbackPage = 1, fallbackSize = 50): Paginated<T> {
  if (Array.isArray(data)) {
    return { items: data as T[], total: (data as T[]).length, page: fallbackPage, page_size: fallbackSize };
  }
  if (data && Array.isArray(data.items)) return data as Paginated<T>;
  return { items: [], total: 0, page: fallbackPage, page_size: fallbackSize };
}

// ---------- API Calls ----------

export async function listVenues(params: ListVenuesParams = {}): Promise<Paginated<Venue>> {
  const res: AxiosResponse = await http.get("/venues", { params });
  return normalizePaginated<Venue>(res.data, params.page ?? 1, params.page_size ?? 50);
}

export async function getVenue(venueId: number): Promise<Venue> {
  const { data } = await http.get(`/venues/${venueId}`); // ✅ backticks
  return data as Venue;
}

export async function listVenueCourts(venueId: number): Promise<CourtSummary[]> {
  const { data } = await http.get(`/venues/${venueId}/courts`); // ✅ backticks
  return data as CourtSummary[];
}

// CRUD (OWNER)
export interface VenueCreate {
  name: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  photos?: VenuePhoto[];
}
export type VenueUpdate = Partial<VenueCreate>;

export async function createVenue(body: VenueCreate): Promise<Venue> {
  const { data } = await http.post("/venues", body);
  return data as Venue;
}

export async function updateVenue(venueId: number, body: VenueUpdate): Promise<Venue> {
  const { data } = await http.patch(`/venues/${venueId}`, body); // ← PATCH
  return data as Venue;
}

export async function deleteVenue(venueId: number): Promise<void> {
  await http.delete(`/venues/${venueId}`); // ✅ backticks
}

// Conveniencia: venues del owner actual
export async function listOwnedVenues(): Promise<Venue[]> {
  // si tu backend soporta ?owned=1
  try {
    const { data } = await http.get("/venues", { params: { owned: 1 } });
    return Array.isArray(data) ? data : (data?.items ?? []);
  } catch {
    // fallback si tenés un endpoint admin dedicado
    const { data } = await http.get("/admin/venues");
    return Array.isArray(data) ? data : (data?.items ?? []);
  }
}

// Destacados (opcional)
export async function listFeaturedVenues(): Promise<Venue[]> {
  try {
    const { data } = await http.get("/venues/featured");
    return Array.isArray(data) ? (data as Venue[]) : (data?.items ?? []);
  } catch {
    const page = await listVenues({ page: 1, page_size: 6 });
    return page.items;
  }
}

export async function listVenuePhotos(venueId: number): Promise<VenuePhoto[]> {
  const { data } = await http.get(`/venues/${venueId}/photos`);
  return data as VenuePhoto[];
}

export async function createVenuePhoto(venueId: number, body: VenuePhotoCreate): Promise<VenuePhoto> {
  const { data } = await http.post(`/venues/${venueId}/photos`, body);
  return data as VenuePhoto;
}

export async function updateVenuePhoto(venueId: number, photoId: number, body: VenuePhotoUpdate): Promise<VenuePhoto> {
  const { data } = await http.patch(`/venues/${venueId}/photos/${photoId}`, body);
  return data as VenuePhoto;
}

export async function deleteVenuePhoto(venueId: number, photoId: number): Promise<void> {
  await http.delete(`/venues/${venueId}/photos/${photoId}`);
}