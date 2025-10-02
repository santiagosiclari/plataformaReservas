import type { Venue, VenueCreate, VenueUpdate } from "../../api/venues.api";
import type { Court, CreateCourtDTO, UpdateCourtDTO, Sport } from "../../api/courts.api";
import type { Price, CreatePriceDTO, UpdatePriceDTO } from "../../api/prices.api";
import type { CourtSchedule, CreateCourtScheduleDTO, UpdateCourtScheduleDTO } from "../../api/schedules.api";

export type {
  Venue, VenueCreate, VenueUpdate,
  Court, CreateCourtDTO, UpdateCourtDTO, Sport,
  Price, CreatePriceDTO, UpdatePriceDTO,
  CourtSchedule, CreateCourtScheduleDTO, UpdateCourtScheduleDTO
};

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
