// src/api/venues.api.ts
import type { AxiosResponse } from "axios";
// If your http client is a named export:
// import { http } from "./http";
// If it's a default export (common in this project style), use:
import http from "./http";

// ---------- Types ----------
export type Sport =
  | "FOOTBALL"
  | "TENNIS"
  | "PADEL";

  export interface Venue {
    id: number;
    name: string;
    address: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
    owner_user_id: number;
    created_at: string;
    courts?: CourtSummary[]; // si tu backend devuelve courts embebidos
  }

  export interface CourtSummary {
    id: number;
    venue_id: number;
    sport: Sport;
    surface?: string | null;
    indoor: boolean;
    number?: string | null; // business number/label, not numeric id
    notes?: string | null;
    }
    export interface ListVenuesParams {
    q?: string;
    sport?: Sport | string;
    city?: string;
    page?: number;
    page_size?: number;
    }

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Some backends return a raw array instead of a {items: []} envelope.
// This helper normalizes either shape into a Paginated object.
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
    const { data } = await http.get(`/venues/${venueId}`);
    return data as Venue;
    }

    export async function listVenueCourts(venueId: number): Promise<CourtSummary[]> {
    const { data } = await http.get(`/venues/${venueId}/courts`);
    return data as CourtSummary[];
    }

    // Optional admin CRUD (keep if needed by OWNER role)
    export interface VenueCreate extends Partial<Venue> {
    name: string;
    }
    export type VenueUpdate = Partial<Venue>;

    export async function createVenue(body: VenueCreate): Promise<Venue> {
    const { data } = await http.post("/venues", body);
    return data as Venue;
    }

    export async function updateVenue(venueId: number, body: VenueUpdate): Promise<Venue> {
    const { data } = await http.put(`/venues/${venueId}`, body);
    return data as Venue;
    }
    
    
export async function deleteVenue(venueId: number): Promise<void> {
    await http.delete(`/venues/${venueId}`);
    }

    // Convenience: featured venues (server may implement /venues/featured or filter via params)
    export async function listFeaturedVenues(): Promise<Venue[]> {
    try {
    const { data } = await http.get("/venues/featured");
    return Array.isArray(data) ? (data as Venue[]) : (data?.items ?? []);
    } catch {
    // fallback to first page if endpoint not available
    const page = await listVenues({ page: 1, page_size: 6 });
    return page.items;
    }
    }