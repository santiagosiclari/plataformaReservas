// src/api/admin.api.ts
const q = (params: Record<string, any>) =>
    Object.entries(params)
      .filter(([,v]) => v !== undefined && v !== null && v !== "")
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
  
  export async function listOwnedVenues() {
    const r = await fetch(`/venues?owned=1`, { headers: { "Content-Type": "application/json" }});
    return r.json();
  }
  
  export async function listCourtsByVenue(venueId: number) {
    const r = await fetch(`/venues/${venueId}/courts`, { headers: { "Content-Type": "application/json" }});
    return r.json();
  }
  
  export async function getSummary(params: any) {
    const r = await fetch(`/admin/stats/summary?${q(params)}`); return r.json();
  }
  export async function getBookingsPerDay(params: any) {
    const r = await fetch(`/admin/stats/bookings-per-day?${q(params)}`); return r.json();
  }
  export async function getRevenuePerDay(params: any) {
    const r = await fetch(`/admin/stats/revenue-per-day?${q(params)}`); return r.json();
  }
  export async function getTop(params: any) {
    const r = await fetch(`/admin/stats/top?${q(params)}`); return r.json();
  }
  export async function getHeatmap(params: any) {
    const r = await fetch(`/admin/stats/heatmap?${q(params)}`); return r.json();
  }
  