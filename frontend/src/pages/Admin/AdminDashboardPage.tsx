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
import "./adminDashboard.css";
// Excel export (SheetJS)
import * as XLSX from "xlsx";

// Tipos (alineados a los del backend/schemas)
interface Venue { id: number; name: string }
interface Court { id: number; number?: string; sport: string }
interface SummaryOut {
  bookings_total: number;
  revenue_total: number;
  cancellations: number;
  cancel_rate: number;
  active_courts: number;
  active_venues: number;
}
interface Point { date: string; value: number }
interface TimeSeriesOut { points: Point[] }
interface TopItem { id: number; name: string; bookings: number; revenue: number }
interface TopOut { items: TopItem[] }
interface HeatCell { weekday: number; hour: number; count: number }
interface HeatmapOut { cells: HeatCell[] }

type CourtOpt = { id: number | ""; label: string };

const fmtMoney = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const subDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

// --- CSV helpers ---
function toCSVRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      // scape comillas, separadores y saltos
      if (/[",;]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    })
    .join(",");
}

function downloadCSV(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const csv = [toCSVRow(header), ...rows.map(toCSVRow)].join("");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- LineChart SVG minimalista ---
function LineChart({ data, height = 140, padding = 28, yLabel }: { data: Point[]; height?: number; padding?: number; yLabel?: string }) {
  const width = 560;
  const vals = data.length ? data.map(d => d.value) : [0];
  const maxY = Math.max(1, ...vals);
  const minY = 0;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yScale = (v: number) => padding + innerH - (v - minY) * innerH / (maxY - minY);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${padding + i * xStep} ${yScale(d.value)}`).join(" ");
  const yTicks = 4;
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[...Array(yTicks + 1)].map((_, i) => {
        const y = padding + innerH * (i / yTicks);
        const val = Math.round(maxY - (maxY - minY) * (i / yTicks));
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} className="grid" />
            <text x={6} y={y + 4} className="tick">{val}</text>
          </g>
        );
      })}
      {yLabel && <text x={width - padding} y={16} className="ylabel">{yLabel}</text>}
      <path d={path} className="line" fill="none" />
      {data.map((d, i) => (i % Math.ceil(data.length / 7) === 0) && (
        <text key={i} x={padding + i * xStep} y={height - 6} className="xtick" textAnchor="middle">{d.date.slice(5)}</text>
      ))}
    </svg>
  );
}

// --- Heatmap 7x24 ---
function Heatmap({ cells }: { cells: HeatCell[] }) {
  const rows = 7, cols = 24;
  const counts = Array.from({ length: rows }, () => Array(cols).fill(0));
  let max = 1;
  for (const c of cells) {
    counts[c.weekday][c.hour] = c.count;
    if (c.count > max) max = c.count;
  }
  return (
    <div className="heatmap">
      {counts.map((row, r) => (
        <div className="heat-row" key={r}>
          {row.map((v, c) => {
            const intensity = v / max; // 0..1
            const alpha = 0.12 + intensity * 0.88; // evita celdas invisibles
            return <div key={c} className="heat-cell" style={{ backgroundColor: `rgba(0,0,0,${alpha})` }} title={`D${r} H${c}: ${v}`} />;
          })}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  // filtros
  const [from, setFrom] = useState(subDaysISO(30));
  const [to, setTo] = useState(todayISO());
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState<number | "">("");
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState<number | "">("");
  const [topType, setTopType] = useState<"courts" | "venues">("courts");

  // opciones courts (con label)
  const courtOpts: CourtOpt[] = useMemo(() => {
    const base: CourtOpt[] = [{ id: "", label: "Todas" }];
    return base.concat(
      courts.map((c) => ({ id: c.id, label: `Cancha ${c.number || c.id} – ${c.sport}` }))
    );
  }, [courts]);

  // datos
  const [summary, setSummary] = useState<SummaryOut | null>(null);
  const [seriesBookings, setSeriesBookings] = useState<Point[]>([]);
  const [seriesRevenue, setSeriesRevenue] = useState<Point[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [heat, setHeat] = useState<HeatCell[]>([]);
  const [loading, setLoading] = useState(false);

  // cargar venues al inicio
  useEffect(() => {
    (async () => {
      try {
        const vs = await listOwnedVenues();
        setVenues(vs);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // cargar courts al cambiar venue
  useEffect(() => {
    (async () => {
      if (!venueId) { setCourts([]); setCourtId(""); return; }
      try {
        const cs = await listCourtsByVenue(Number(venueId));
        setCourts(cs);
      } catch (e) { console.error(e); }
    })();
  }, [venueId]);

  // fetch métricas
  useEffect(() => {
    (async () => {
      setLoading(true);
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
        setSummary(s as SummaryOut);
        setSeriesBookings((bpd as TimeSeriesOut).points || []);
        setSeriesRevenue((rpd as TimeSeriesOut).points || []);
        setTopItems((top as TopOut).items || []);
        setHeat((hm as HeatmapOut).cells || []);
      } catch (e) {
        console.error("Error fetching admin stats", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, venueId, courtId, topType]);

  const venueOpts = useMemo(() => [{ id: "", name: "Todas" }, ...venues], [venues]);

  // --- Exportadores CSV ---
  function exportSummaryCSV() {
    if (!summary) return;
    const header = ["métrica", "valor"];
    const rows = [
      ["bookings_total", summary.bookings_total],
      ["revenue_total", summary.revenue_total],
      ["cancellations", summary.cancellations],
      ["cancel_rate", summary.cancel_rate],
      ["active_courts", summary.active_courts],
      ["active_venues", summary.active_venues],
    ];
    downloadCSV(`summary_${from}_a_${to}.csv`, header, rows);
  }

  function exportSeriesCSV(kind: "bookings" | "revenue") {
    const data = kind === "bookings" ? seriesBookings : seriesRevenue;
    const header = ["fecha", kind === "bookings" ? "bookings" : "revenue"];
    const rows = data.map(p => [p.date, p.value]);
    downloadCSV(`${kind}_per_day_${from}_a_${to}.csv`, header, rows);
  }

  function exportTopCSV() {
    const header = ["id", "nombre", "bookings", "revenue"];
    const rows = topItems.map(t => [t.id, t.name, t.bookings, t.revenue]);
    downloadCSV(`top_${topType}_${from}_a_${to}.csv`, header, rows);
  }

  function exportHeatmapCSV() {
    const header = ["weekday", "hour", "count"];
    const rows = heat.map(c => [c.weekday, c.hour, c.count]);
    downloadCSV(`heatmap_${from}_a_${to}.csv`, header, rows);
  }

  function exportAllCSV() {
    exportSummaryCSV();
    exportSeriesCSV("bookings");
    exportSeriesCSV("revenue");
    exportTopCSV();
    exportHeatmapCSV();
  }

  // --- Exportador Excel (XLSX) multi-hoja ---
  function exportAllXLSX() {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    if (summary) {
      const rows = [
        { metric: "bookings_total", value: summary.bookings_total },
        { metric: "revenue_total", value: summary.revenue_total },
        { metric: "cancellations", value: summary.cancellations },
        { metric: "cancel_rate", value: summary.cancel_rate },
        { metric: "active_courts", value: summary.active_courts },
        { metric: "active_venues", value: summary.active_venues },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
    }

    // Bookings per day
    if (seriesBookings.length) {
      const ws = XLSX.utils.json_to_sheet(seriesBookings.map(p => ({ date: p.date, bookings: p.value })));
      XLSX.utils.book_append_sheet(wb, ws, "BookingsPerDay");
    }

    // Revenue per day
    if (seriesRevenue.length) {
      const ws = XLSX.utils.json_to_sheet(seriesRevenue.map(p => ({ date: p.date, revenue: p.value })));
      XLSX.utils.book_append_sheet(wb, ws, "RevenuePerDay");
    }

    // Top
    if (topItems.length) {
      const ws = XLSX.utils.json_to_sheet(topItems.map(t => ({ id: t.id, name: t.name, bookings: t.bookings, revenue: t.revenue })));
      XLSX.utils.book_append_sheet(wb, ws, topType === "courts" ? "TopCourts" : "TopVenues");
    }

    // Heatmap
    if (heat.length) {
      const ws = XLSX.utils.json_to_sheet(heat.map(h => ({ weekday: h.weekday, hour: h.hour, count: h.count })));
      XLSX.utils.book_append_sheet(wb, ws, "Heatmap");
    }

    const vid = venueId ? `venue${venueId}_` : "";
    const cid = courtId ? `court${courtId}_` : "";
    XLSX.writeFile(wb, `dashboard_${vid}${cid}${from}_a_${to}.xlsx`);
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <div className="filters">
          <label>
            <span>Desde</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
          <label>
            <span>Venue</span>
            <select value={venueId} onChange={(e) => setVenueId(e.target.value ? Number(e.target.value) : "")}> 
              {venueOpts.map(v => <option key={String(v.id)} value={String(v.id)}>{v.name}</option>)}
            </select>
          </label>
          <label>
            <span>Court</span>
            <select value={courtId} onChange={(e) => setCourtId(e.target.value ? Number(e.target.value) : "")}> 
              {courtOpts.map((opt) => (
                <option key={String(opt.id)} value={String(opt.id)}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Top</span>
            <select value={topType} onChange={e => setTopType(e.target.value as any)}>
              <option value="courts">Courts</option>
              <option value="venues">Venues</option>
            </select>
          </label>
          {/* Export buttons */}
          <div className="export-group">
            <button className="btn" onClick={exportAllCSV}>Exportar todo (CSV)</button>
            <button className="btn" onClick={exportAllXLSX}>Exportar todo (Excel)</button>
            <div className="export-split">
              <button className="btn btn-ghost" onClick={exportSummaryCSV}>Summary CSV</button>
              <button className="btn btn-ghost" onClick={() => exportSeriesCSV("bookings")}>Bookings CSV</button>
              <button className="btn btn-ghost" onClick={() => exportSeriesCSV("revenue")}>Revenue CSV</button>
              <button className="btn btn-ghost" onClick={exportTopCSV}>Top CSV</button>
              <button className="btn btn-ghost" onClick={exportHeatmapCSV}>Heatmap CSV</button>
            </div>
          </div>
          </div>
        </div>

      {/* Summary cards */}
      <div className="cards">
        <div className="card">
          <div className="card-title">Reservas</div>
          <div className="card-value">{summary?.bookings_total ?? "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Ingresos</div>
          <div className="card-value">{summary ? fmtMoney(summary.revenue_total) : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Cancelaciones</div>
          <div className="card-value">{summary?.cancellations ?? "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Tasa de cancelación</div>
          <div className="card-value">{summary ? (summary.cancel_rate * 100).toFixed(1) + "%" : "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Courts activos</div>
          <div className="card-value">{summary?.active_courts ?? "—"}</div>
        </div>
        <div className="card">
          <div className="card-title">Venues activos</div>
          <div className="card-value">{summary?.active_venues ?? "—"}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="panels">
        <div className="panel">
          <div className="panel-header">Reservas por día</div>
          <LineChart data={seriesBookings} yLabel="#" />
        </div>
        <div className="panel">
          <div className="panel-header">Ingresos por día</div>
          <LineChart data={seriesRevenue} yLabel="$" />
        </div>
      </div>

      {/* Top */}
      <div className="panel">
        <div className="panel-header">Top {topType === "courts" ? "Courts" : "Venues"}</div>
        <table className="top-table">
          <thead>
            <tr><th>Nombre</th><th style={{textAlign:"right"}}>Reservas</th><th style={{textAlign:"right"}}>Ingresos</th></tr>
          </thead>
          <tbody>
            {topItems.map(it => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td style={{textAlign:"right"}}>{it.bookings}</td>
                <td style={{textAlign:"right"}}>{fmtMoney(it.revenue)}</td>
              </tr>
            ))}
            {topItems.length === 0 && <tr><td colSpan={3} className="muted">Sin datos</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Heatmap */}
      <div className="panel">
        <div className="panel-header">Heatmap demanda (día × hora)</div>
        <Heatmap cells={heat} />
        <div className="heat-legend">
          <span className="muted">Dom</span>
          <span className="muted" style={{marginLeft:"auto"}}>0h → 23h</span>
        </div>
      </div>

      {loading && <div className="loading">Cargando…</div>}
    </div>
  );
}
