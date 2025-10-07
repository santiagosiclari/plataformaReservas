import React, { useEffect, useMemo, useState } from "react";
import {
  listOwnedVenues,
  listCourtsByVenue,
  getSummary,
  getBookingsPerDay,
  getRevenuePerDay,
  getTop,
  getHeatmap,
} from "../../api/admin.api";
import { todayISO, subDaysISO } from "../../utils/dates";
import { downloadCSV } from "../../utils/csv";
import * as XLSX from "xlsx";

// MUI
import { Box, Stack, Typography, Alert } from "@mui/material";

// Componentes
import DashboardHeaderActions from "../../components/admin/stats/DashboardHeaderActions";
import DashboardFilters from "../../components/admin/stats/DashboardFilters";
import SummaryCards from "../../components/admin/stats/SummaryCards";
import SeriesPanel from "../../components/admin/stats/SeriesPanel";
import TopTable from "../../components/admin/stats/TopTable";
import HeatmapPanel from "../../components/admin/stats/HeatmapPanel";
import LoadingOverlay from "../../components/admin/stats/LoadingOverlay";

// Tipos
import type {
  Venue,
  Court,
  CourtOpt,
  SummaryOut,
  Point,
  TopItem,
  HeatCell,
  TimeSeriesOut,
  TopOut,
  HeatmapOut,
} from "../../components/admin/admin.types";

export default function AdminDashboardPage() {
  // --- Filtros ---
  const [from, setFrom] = useState(subDaysISO(30));
  const [to, setTo] = useState(todayISO());
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState<number | "">("");
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState<number | "">("");
  const [topType, setTopType] = useState<"courts" | "venues">("courts");

  const courtOpts: CourtOpt[] = useMemo(() => {
    const base: CourtOpt[] = [{ id: "", label: "Todas" }];
    return base.concat(
      courts.map((c) => ({
        id: c.id,
        label: `Cancha ${c.number || c.id} – ${c.sport}`,
      }))
    );
  }, [courts]);

  // --- Datos ---
  const [summary, setSummary] = useState<SummaryOut | null>(null);
  const [seriesBookings, setSeriesBookings] = useState<Point[]>([]);
  const [seriesRevenue, setSeriesRevenue] = useState<Point[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [heat, setHeat] = useState<HeatCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- Cargar venues ---
  useEffect(() => {
    (async () => {
      try {
        const vs = await listOwnedVenues();
        setVenues(vs || []);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar los venues.");
      }
    })();
  }, []);

  // --- Cargar courts al cambiar venue ---
  useEffect(() => {
    (async () => {
      try {
        if (!venueId) {
          setCourts([]);
          setCourtId("");
          return;
        }
        const cs = await listCourtsByVenue(Number(venueId));
        setCourts(cs || []);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar las canchas del venue seleccionado.");
      }
    })();
  }, [venueId]);

  // --- Cargar métricas ---
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const vid = venueId ? Number(venueId) : undefined;
        const cid = courtId ? Number(courtId) : undefined;

        const [s, bpd, rpd, top, hm] = await Promise.all([
          getSummary({ from, to, venue_id: vid, court_id: cid }),
          getBookingsPerDay({ from, to, venue_id: vid, court_id: cid }),
          getRevenuePerDay({ from, to, venue_id: vid, court_id: cid }),
          getTop({ from, to, type: topType }),
          getHeatmap({ from, to, venue_id: vid, court_id: cid }),
        ]);

        setSummary((s as SummaryOut) ?? null);
        setSeriesBookings(((bpd as TimeSeriesOut)?.points) || []);
        setSeriesRevenue(((rpd as TimeSeriesOut)?.points) || []);
        setTopItems(((top as TopOut)?.items) || []);
        setHeat(((hm as HeatmapOut)?.cells) || []);
      } catch (e) {
        console.error("Error fetching admin stats", e);
        setErr("No se pudieron cargar las métricas del dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, venueId, courtId, topType]);

  // --- Exportadores ---
  function exportAllXLSX() {
    const wb = XLSX.utils.book_new();

    if (summary) {
      const ws = XLSX.utils.json_to_sheet([
        { metric: "bookings_total", value: summary.bookings_total },
        { metric: "revenue_total", value: summary.revenue_total },
        { metric: "cancellations", value: summary.cancellations },
        { metric: "cancel_rate", value: summary.cancel_rate },
        { metric: "active_courts", value: summary.active_courts },
        { metric: "active_venues", value: summary.active_venues },
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
    }

    if (seriesBookings.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(seriesBookings),
        "BookingsPerDay"
      );

    if (seriesRevenue.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(seriesRevenue),
        "RevenuePerDay"
      );

    if (topItems.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(topItems),
        topType === "courts" ? "TopCourts" : "TopVenues"
      );

    if (heat.length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(heat), "Heatmap");

    XLSX.writeFile(wb, `dashboard_${from}_a_${to}.xlsx`);
  }

  function exportAllCSV() {
    if (summary)
      downloadCSV(
        `summary_${from}_a_${to}.csv`,
        ["métrica", "valor"],
        Object.entries(summary)
      );
  }

  // --- Render ---
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header + acciones */}
      <DashboardHeaderActions
        onExportAllCSV={exportAllCSV}
        onExportAllXLSX={exportAllXLSX}
      />

      {/* Filtros */}
      <DashboardFilters
        from={from}
        to={to}
        venueId={venueId}
        courtId={courtId}
        topType={topType}
        venues={venues}
        courtOpts={courtOpts}
        onChangeFrom={setFrom}
        onChangeTo={setTo}
        onChangeVenue={setVenueId}
        onChangeCourt={setCourtId}
        onChangeTopType={setTopType}
      />

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {/* Resumen */}
      <SummaryCards summary={summary} />

      {/* Series */}
      <SeriesPanel title="Reservas por día" data={seriesBookings} yLabel="#" />
      <SeriesPanel title="Ingresos por día" data={seriesRevenue} yLabel="$" />


      <TopTable
      items={topItems}
      title={`Top ${topType === "courts" ? "Courts" : "Venues"}`}
      />

      {/* Heatmap */}
      <HeatmapPanel cells={heat} />

      {/* Cargando */}
      <LoadingOverlay open={loading} />
    </Box>
  );
}
