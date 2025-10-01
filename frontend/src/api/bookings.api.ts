// src/api/bookings.api.ts
// Bookings API client aligned to your SQLAlchemy model and state machine.
// Includes court/venue-scoped endpoints and top-level booking operations.

import http from "./http";

// ---------------------------------
// Types
// ---------------------------------
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "CANCELLED_LATE" | string; // allow backend extras

export interface Booking {
  id: number;
  user_id: number;
  court_id: number;
  start_datetime: string; // ISO8601
  end_datetime: string;   // ISO8601
  status: BookingStatus;
  /** Backend may serialize Decimal as string; accept both */
  price_total: number;
  created_at: string; // ISO8601
}

export interface CreateBookingDTO {
  court_id: number;
  start_datetime: string; // ISO8601 (alineado al slot)
  end_datetime: string;   // ISO8601
  status?: BookingStatus; // opcional; el server default = CONFIRMED
}

export interface UpdateBookingDTO {
  // Typically bookings are immutable except for admin actions
  start_datetime?: string;
  end_datetime?: string;
  status?: BookingStatus;
  price_total?: string | number;
}

export interface ListBookingsParams {
  user_id?: number;
  court_id?: number;
  status?: BookingStatus;
  date_from?: string; // ISO8601
  date_to?: string;   // ISO8601 (exclusive or inclusive depending on backend)
  page?: number;
  page_size?: number;
}

// ---------------------------------
// Helpers
// ---------------------------------
export function parsePrice(value: string | number): number {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function durationMinutes(b: Pick<Booking, "start_datetime" | "end_datetime">): number {
  const start = new Date(b.start_datetime).getTime();
  const end = new Date(b.end_datetime).getTime();
  return Math.max(0, Math.floor((end - start) / 60000));
}

export const isActiveStatus = (s: BookingStatus) => s === "PENDING" || s === "CONFIRMED";

// ---------------------------------
// Court-scoped endpoints (canonical with venues)
// e.g. /venues/:venueId/courts/:courtId/bookings
// ---------------------------------
export async function listCourtBookings(
  venueId: number,
  courtId: number,
  params: Omit<ListBookingsParams, "court_id"> = {}
): Promise<Booking[]> {
  const { data } = await http.get(`/venues/${venueId}/courts/${courtId}/bookings`, { params });
  return data as Booking[];
}

export async function listBookings(params: ListBookingsParams = {}): Promise<Booking[]> {
    const { data } = await http.get(`/bookings`, { params });
    return data as Booking[];
  }

  export interface CreateBookingTopLevel {
    court_id: number;
    start_datetime: string;
    end_datetime: string;
    price_total: number;       // requerido
    status?: BookingStatus;    // opcional
    user_id?: number;          // 👈 opcional (ni se manda)
  }

  export async function createBooking(body: CreateBookingDTO): Promise<Booking> {
    const { data } = await http.post(`/bookings`, body);
    return data as Booking;
  }

// ---------------------------------
// Top-level bookings (by id)
// ---------------------------------
export async function getBooking(bookingId: number): Promise<Booking> {
  const { data } = await http.get(`/bookings/${bookingId}`);
  return data as Booking;
}

export async function updateBooking(bookingId: number, body: UpdateBookingDTO): Promise<Booking> {
  const { data } = await http.patch(`/bookings/${bookingId}`, body);
  return data as Booking;
}

export async function deleteBooking(bookingId: number): Promise<void> {
  await http.delete(`/bookings/${bookingId}`);
}

// ---------------------------------
// State machine actions
// POST /bookings/:id/confirm
// POST /bookings/:id/cancel { reason?, late_window_hours? }
// ---------------------------------
export async function confirmBooking(bookingId: number): Promise<Booking> {
  const { data } = await http.post(`/bookings/${bookingId}/confirm`);
  return data as Booking;
}

export interface CancelBookingDTO {
  reason?: string | null;
  // If your backend needs it; otherwise omit when calling
  late_window_hours?: number;
}

export async function cancelBooking(bookingId: number, body: CancelBookingDTO = {}): Promise<Booking> {
  const { data } = await http.post(`/bookings/${bookingId}/cancel`, body);
  return data as Booking;
}

// ---------------------------------
// Convenience: current user's bookings
// ---------------------------------
export async function listMyBookings(): Promise<Booking[]> {
  const { data } = await http.get("/bookings", { params: { mine: true } });
  return data as Booking[];
}
