import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getMe } from "../../api/auth.api";
import { listMyBookings, listCourtBookings, type Booking } from "../../api/bookings.api";
import { listOwnedVenues, listCourtsByVenue } from "../../api/admin.api";

type Role = "PLAYER" | "OWNER" | string;

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

export default function BookingsPage() {
  const [params] = useSearchParams();
  const mineParam = params.get("mine") === "1";

  const [role, setRole] = useState<Role>("PLAYER");
  const [tab, setTab] = useState<"mine" | "owner">("mine");

  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar rol del usuario
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setRole(me.role as Role);
        // si viene con ?mine=1, arrancamos en "mine"; si es owner y no vino, podrías arrancar en "owner"
        setTab(mineParam ? "mine" : (me.role === "OWNER" ? "owner" : "mine"));
      } catch {
        setRole("PLAYER");
      }
    })();
  }, [mineParam]);

  // Cargar datos según tab
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (tab === "mine") {
          // 1) Intentá /me/bookings
          try {
            const data = await listMyBookings();
            setRows(data);
          } catch (e: any) {
            // 2) Fallback a /bookings?mine=1 si tu backend usa ese patrón
            const r = await fetch("/bookings?mine=1", { headers: { "Content-Type": "application/json" } });
            if (r.ok) {
              setRows(await r.json());
            } else {
              setRows([]);
            }
          }
        } else {
          // OWNER: traer reservas de todas mis canchas
          const venues = await listOwnedVenues();
          const all: Booking[] = [];
          for (const v of venues) {
            const courts = await listCourtsByVenue(v.id);
            for (const c of courts) {
              const cb = await listCourtBookings(v.id, c.id, { /* date_from/date_to si querés */ });
              all.push(...cb);
            }
          }
          // ordenar por fecha inicio descendente
          all.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
          setRows(all);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [tab]);

  const canOwner = role === "OWNER";

  const header = useMemo(() => (
    <div className="container" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <h1 style={{ marginRight: "auto" }}>📅 Reservas</h1>
      <div className="tabs">
        <button className={`tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>
          Mis reservas
        </button>
        {canOwner && (
          <button className={`tab ${tab === "owner" ? "active" : ""}`} onClick={() => setTab("owner")}>
            Reservas de mis sedes
          </button>
        )}
      </div>
    </div>
  ), [tab, canOwner]);

  return (
    <div className="container" style={{ padding: 16 }}>
      {header}
      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No hay reservas para mostrar.</p>
      ) : (
        <table className="table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #222" }}>#</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #222" }}>Court</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #222" }}>Inicio</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #222" }}>Fin</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #222" }}>Estado</th>
              <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #222" }}>Precio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td style={{ padding: 8 }}>#{b.id}</td>
                <td style={{ padding: 8 }}>
                  {/* Mostrá algo legible; si tenés court join en back, adaptá: */}
                  Court {b.court_id}
                </td>
                <td style={{ padding: 8 }}>{fmt(b.start_datetime)}</td>
                <td style={{ padding: 8 }}>{fmt(b.end_datetime)}</td>
                <td style={{ padding: 8 }}>{b.status}</td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  {(typeof b.price_total === "string" ? Number(b.price_total) : b.price_total || 0).toLocaleString("es-AR", {
                    style: "currency", currency: "ARS", maximumFractionDigits: 0
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
