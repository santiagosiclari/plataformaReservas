/* import * as XLSX from "xlsx";
import type { SummaryOut, Point, TopItem, HeatCell } from "../types";

export function buildDashboardWorkbook(
  data: { summary?: SummaryOut|null; bookings?: Point[]; revenue?: Point[]; top?: TopItem[]; heat?: HeatCell[] },
  sheetNames: Partial<Record<"summary"|"bookings"|"revenue"|"top"|"heat", string>> = {}
) {
  const wb = XLSX.utils.book_new();
  if (data.summary) {
    const rows = Object.entries({
      bookings_total: data.summary.bookings_total,
      revenue_total: data.summary.revenue_total,
      cancellations: data.summary.cancellations,
      cancel_rate: data.summary.cancel_rate,
      active_courts: data.summary.active_courts,
      active_venues: data.summary.active_venues,
    }).map(([metric, value]) => ({ metric, value }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetNames.summary ?? "Summary");
  }
  if (data.bookings?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.bookings.map(p => ({ date:p.date, bookings:p.value }))), sheetNames.bookings ?? "BookingsPerDay");
  if (data.revenue?.length)  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.revenue.map(p => ({ date:p.date, revenue:p.value }))), sheetNames.revenue ?? "RevenuePerDay");
  if (data.top?.length)      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.top.map(t => ({ id:t.id, name:t.name, bookings:t.bookings, revenue:t.revenue }))), sheetNames.top ?? "Top");
  if (data.heat?.length)     XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.heat.map(h => ({ weekday:h.weekday, hour:h.hour, count:h.count }))), sheetNames.heat ?? "Heatmap");
  return wb;
}
 */