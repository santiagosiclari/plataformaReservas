// src/api/venuesPublic.api.ts
import http from "../api/http";

export type PublicVenueGeo = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
    properties: { id: number; name: string; address: string; city: string };
  }>;
};

export interface VenuePublic {
    id: number; name: string; address: string; city: string;
    latitude?: number | null; longitude?: number | null;
  }
  export interface Paginated<T> {
    items: T[]; total: number; page: number; page_size: number;
  }
  export async function listPublicVenues(params: {
    q?: string; city?: string; sport?: string; page?: number; page_size?: number;
  } = {}): Promise<Paginated<VenuePublic>> {
    const { data } = await http.get("/public/venues", { params });
    return data as Paginated<VenuePublic>;
  }

export async function getPublicVenuesGeo(): Promise<PublicVenueGeo> {
  const { data } = await http.get("/public/venues/geo");
  return data;
}
