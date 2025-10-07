// src/api/admin.api.ts
import http from "./http";

export async function listOwnedVenues() {
  const { data } = await http.get(`/venues`, { params: { owned: 1 } });
  return data;
}
export async function listCourtsByVenue(venueId: number) {
  const { data } = await http.get(`/venues/${venueId}/courts`);
  return data;
}
export async function getSummary(params: any) {
  const { data } = await http.get(`/admin/stats/summary`, { params });
  return data;
}
export async function getBookingsPerDay(params: any) {
  const { data } = await http.get(`/admin/stats/bookings-per-day`, { params });
  return data;
}
export async function getRevenuePerDay(params: any) {
  const { data } = await http.get(`/admin/stats/revenue-per-day`, { params });
  return data;
}
export async function getTop(params: any) {
  const { data } = await http.get(`/admin/stats/top`, { params });
  return data;
}
export async function getHeatmap(params: any) {
  const { data } = await http.get(`/admin/stats/heatmap`, { params });
  return data;
}
