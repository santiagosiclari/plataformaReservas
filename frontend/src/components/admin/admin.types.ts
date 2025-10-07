// --- Tipos que ya tenías (no se modifican)
import type { Venue, VenueCreate, VenueUpdate } from "../../api/venues.api";
import type { Court, CreateCourtDTO, UpdateCourtDTO, Sport } from "../../api/courts.api";
import type { Price, CreatePriceDTO, UpdatePriceDTO } from "../../api/prices.api";
import type { CourtSchedule, CreateCourtScheduleDTO, UpdateCourtScheduleDTO } from "../../api/schedules.api";

export type {
  Venue,
  VenueCreate,
  VenueUpdate,
  Court,
  CreateCourtDTO,
  UpdateCourtDTO,
  Sport,
  Price,
  CreatePriceDTO,
  UpdatePriceDTO,
  CourtSchedule,
  CreateCourtScheduleDTO,
  UpdateCourtScheduleDTO,
};

// --- Props existentes
export interface VenueListProps {
  venues: Venue[];
  venueId: number | null;
  onSelect: (id: number) => void;
  onCreate: (v: VenueCreate) => void;
  onUpdate: (v: VenueUpdate) => void;
  onDelete: () => void;
}

export interface CourtSelectorProps {
  courts: Court[];
  courtId: number | null;
  onSelect: (id: number) => void;
  onCreate: (c: CreateCourtDTO) => void;
  onUpdate: (c: UpdateCourtDTO) => void;
  onDelete: () => void;
}

export interface PricesEditorProps {
  prices: Price[];
  onCreate: (p: CreatePriceDTO) => void;
  onUpdate: (id: number, p: UpdatePriceDTO) => void;
  onDelete: (id: number) => void;
}

export interface SchedulesEditorProps {
  schedules: CourtSchedule[];
  onCreate: (s: CreateCourtScheduleDTO) => void;
  onUpdate: (id: number, s: UpdateCourtScheduleDTO) => void;
  onDelete: (id: number) => void;
}

// --- Tipos usados en Admin Dashboard (faltantes)
export interface SummaryOut {
  bookings_total: number;
  revenue_total: number;
  cancellations: number;
  cancel_rate: number;
  active_courts: number;
  active_venues: number;
}

export interface Point {
  date: string;
  value: number;
}

export interface TimeSeriesOut {
  points: Point[];
}

export interface TopItem {
  id: number;
  name: string;
  bookings: number;
  revenue: number;
}

export interface TopOut {
  items: TopItem[];
}

export interface HeatCell {
  weekday: number;
  hour: number;
  count: number;
}

export interface HeatmapOut {
  cells: HeatCell[];
}

export type CourtOpt = { id: number | ""; label: string };
