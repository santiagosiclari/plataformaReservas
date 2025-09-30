import http from "./http";

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

export async function searchCourts(params: SearchCourtsParams) {
  const { data } = await http.get<CourtSearchResult[]>("/venues/courts/search", {
    params,
  });
  return data;
}

export async function getCourt(id: number) {
  const { data } = await http.get<CourtSearchResult>(`/courts/${id}`);
  return data;
}
