import React from "react";
import {
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import type { CourtOpt, Venue } from "../admin.types";

type Props = {
  from: string;
  to: string;
  venueId: number | "";
  courtId: number | "";
  topType: "courts" | "venues";
  venues: Venue[];
  courtOpts: CourtOpt[];
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onChangeVenue: (v: number | "") => void;
  onChangeCourt: (v: number | "") => void;
  onChangeTopType: (v: "courts" | "venues") => void;
};

export default function DashboardFilters({
  from,
  to,
  venueId,
  courtId,
  topType,
  venues,
  courtOpts,
  onChangeFrom,
  onChangeTo,
  onChangeVenue,
  onChangeCourt,
  onChangeTopType,
}: Props) {
  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
      }}
      elevation={1}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        useFlexGap
        flexWrap="wrap"
      >
        {/* Fechas */}
        <TextField
          fullWidth
          type="date"
          label="Desde"
          value={from}
          onChange={(e) => onChangeFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          type="date"
          label="Hasta"
          value={to}
          onChange={(e) => onChangeTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {/* Venue */}
        <FormControl fullWidth>
          <InputLabel id="venue-label">Venue</InputLabel>
          <Select
            labelId="venue-label"
            label="Venue"
            value={venueId === "" ? "" : String(venueId)}
            onChange={(e) => {
              const v = e.target.value;
              onChangeVenue(v ? Number(v) : "");
            }}
          >
            <MenuItem value="">Todas</MenuItem>
            {venues.map((v) => (
              <MenuItem key={String(v.id)} value={String(v.id)}>
                {v.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Court */}
        <FormControl fullWidth>
          <InputLabel id="court-label">Court</InputLabel>
          <Select
            labelId="court-label"
            label="Court"
            value={courtId === "" ? "" : String(courtId)}
            onChange={(e) => {
              const v = e.target.value;
              onChangeCourt(v ? Number(v) : "");
            }}
          >
            <MenuItem value="">Todas</MenuItem>
            {courtOpts.map((opt) => (
              <MenuItem key={String(opt.id)} value={String(opt.id)}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tipo de Top */}
        <FormControl fullWidth>
          <InputLabel id="top-label">Top</InputLabel>
          <Select
            labelId="top-label"
            label="Top"
            value={topType}
            onChange={(e) => onChangeTopType(e.target.value as "courts" | "venues")}
          >
            <MenuItem value="courts">Courts</MenuItem>
            <MenuItem value="venues">Venues</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  );
}

