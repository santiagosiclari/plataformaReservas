import React from "react";
import type { BookingStatus } from "../../api/bookings.api";

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<string, string> = {
    PENDING: "badge-pending",
    CONFIRMED: "badge-ok",
    CANCELLED: "badge-cancel",
    CANCELLED_LATE: "badge-warn",
    EXPIRED: "badge-expired",
    NO_SHOW: "badge-warn",
    REFUNDED: "badge-info",
  };
  const cls = map[status] ?? "badge";
  return <span className={`badge ${cls}`}>{status}</span>;
}
