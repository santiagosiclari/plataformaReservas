// src/api/schedules.api.ts
// Thin client for Court Schedules, aligned to your SQLAlchemy model.
// Path convention used: /courts/:courtId/schedules
// If your backend prefixes with venue (e.g., /venues/:venueId/courts/:courtId/schedules),
// you can switch to the Venue-scoped helpers provided below.

import http from "./http";

// ---------------------------------
// Types
// ---------------------------------
export interface CourtSchedule {
  id: number;
  court_id: number;
  /** 0..6 (Monday=0 if you follow Python datetime.weekday) */
  weekday: number;
  /** "HH:MM:SS" 24h */
  open_time: string;
  /** "HH:MM:SS" 24h */
  close_time: string;
  /** default 60 */
  slot_minutes: number;
}

export interface CreateCourtScheduleDTO {
  weekday: number; // 0..6
  open_time: string; // "HH:MM:SS"
  close_time: string; // "HH:MM:SS"
  slot_minutes?: number; // default 60
}

export interface UpdateCourtScheduleDTO {
  weekday?: number;
  open_time?: string;
  close_time?: string;
  slot_minutes?: number;
}

// ---------------------------------
// Helpers
// ---------------------------------
export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]; // Ajustá si Monday!=0

export function formatRange(s: CourtSchedule): string {
  return `${s.open_time.substring(0, 5)}–${s.close_time.substring(0, 5)}`;
}

// ---------------------------------
// Court-scoped endpoints: /courts/:courtId/schedules
// ---------------------------------
export async function listSchedules(courtId: number): Promise<CourtSchedule[]> {
  const { data } = await http.get(`/courts/${courtId}/schedules`);
  return data as CourtSchedule[];
}

export async function getSchedule(courtId: number, scheduleId: number): Promise<CourtSchedule> {
  const { data } = await http.get(`/courts/${courtId}/schedules/${scheduleId}`);
  return data as CourtSchedule;
}

export async function createSchedule(
  courtId: number,
  body: CreateCourtScheduleDTO
): Promise<CourtSchedule> {
  const { data } = await http.post(`/courts/${courtId}/schedules`, body);
  return data as CourtSchedule;
}

export async function updateSchedule(
  courtId: number,
  scheduleId: number,
  body: UpdateCourtScheduleDTO
): Promise<CourtSchedule> {
  const { data } = await http.put(`/courts/${courtId}/schedules/${scheduleId}`, body);
  return data as CourtSchedule;
}

export async function deleteSchedule(courtId: number, scheduleId: number): Promise<void> {
  await http.delete(`/courts/${courtId}/schedules/${scheduleId}`);
}

// ---------------------------------
// Optional: Venue-scoped (if your router nests under venues)
// e.g. /venues/:venueId/courts/:courtId/schedules
// ---------------------------------
export const venueScoped = {
  list: async (venueId: number, courtId: number): Promise<CourtSchedule[]> => {
    const { data } = await http.get(`/venues/${venueId}/courts/${courtId}/schedules`);
    return data as CourtSchedule[];
  },
  get: async (venueId: number, courtId: number, scheduleId: number): Promise<CourtSchedule> => {
    const { data } = await http.get(`/venues/${venueId}/courts/${courtId}/schedules/${scheduleId}`);
    return data as CourtSchedule;
  },
  create: async (
    venueId: number,
    courtId: number,
    body: CreateCourtScheduleDTO
  ): Promise<CourtSchedule> => {
    const { data } = await http.post(`/venues/${venueId}/courts/${courtId}/schedules`, body);
    return data as CourtSchedule;
  },
  update: async (
    venueId: number,
    courtId: number,
    scheduleId: number,
    body: UpdateCourtScheduleDTO
  ): Promise<CourtSchedule> => {
    const { data } = await http.put(`/venues/${venueId}/courts/${courtId}/schedules/${scheduleId}`, body);
    return data as CourtSchedule;
  },
  delete: async (venueId: number, courtId: number, scheduleId: number): Promise<void> => {
    await http.delete(`/venues/${venueId}/courts/${courtId}/schedules/${scheduleId}`);
  },
};

// ---------------------------------
// Optional bulk helpers (use only if backend supports them)
// ---------------------------------
export async function replaceAllSchedules(
  courtId: number,
  schedules: CreateCourtScheduleDTO[]
): Promise<CourtSchedule[]> {
  // Convention: PUT to collection replaces all
  const { data } = await http.put(`/courts/${courtId}/schedules`, schedules);
  return data as CourtSchedule[];
}

export async function upsertSchedules(
  courtId: number,
  schedules: (CreateCourtScheduleDTO & { id?: number })[]
): Promise<CourtSchedule[]> {
  // Convention: POST /bulk for upsert; adjust path if different
  const { data } = await http.post(`/courts/${courtId}/schedules/bulk`, { items: schedules });
  return data as CourtSchedule[];
}
