import { useEffect, useState } from "react";
import { getMe } from "../../api/auth.api";
import { listMyBookings, listOwnerBookings, type Booking } from "../../api/bookings.api";

type Role = "PLAYER" | "OWNER" | "ADMIN" | string;

export function useBookingsData(mineParam: boolean, tab: "mine" | "owner") {
  const [role, setRole] = useState<Role>("PLAYER");
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const canOwner = role === "OWNER" || role === "ADMIN";

  // rol + tab inicial
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setRole(me.role as Role);
      } catch {
        setRole("PLAYER");
      }
    })();
  }, []);

  // datos
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (tab === "mine") {
          try {
            const data = await listMyBookings();
            setRows(data);
          } catch {
            const r = await fetch("/api/v1/bookings?mine=1");
            setRows(r.ok ? await r.json() : []);
          }
        } else {
          const data = await listOwnerBookings({});
          data.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
          setRows(data);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando reservas");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab]);

  return { role, canOwner, rows, setRows, loading, err, setErr };
}
