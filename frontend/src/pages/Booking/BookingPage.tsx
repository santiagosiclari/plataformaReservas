import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  getCourtPublic,
  getAvailabilityPublic,
  type CourtDetailPublic,
  type AvailabilitySlot,
} from "../../api/courts.api";
import { createBooking } from "../../api/bookings.api";
import { isAuthenticated } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";
import "./booking.css";

function fmtDate(d: string) {
  // YYYY-MM-DD -> dd/mm/yyyy
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function fmtHour(iso: string) {
  const dt = new Date(iso);
  return dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const BookingPage: React.FC = () => {
  const [params] = useSearchParams();
  const courtId = Number(params.get("courtId"));
  const date = params.get("date") || "";
  const startISO = params.get("start") || "";
  const endISO = params.get("end") || "";
  const slotsCountParam = params.get("slots");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // data
  const [court, setCourt] = useState<CourtDetailPublic | null>(null);
  const [daySlots, setDaySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [priceWarn, setPriceWarn] = useState<string | null>(null);

  // 1) cargar datos y revalidar selección
  useEffect(() => {
    async function load() {
      if (!courtId || !date || !startISO || !endISO) {
        setErr("Faltan parámetros de la reserva.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      setPriceWarn(null);
      try {
        const c = await getCourtPublic(courtId);
        setCourt(c);
        const a = await getAvailabilityPublic(courtId, date);
        setDaySlots(a.slots);
      } catch (e) {
        console.error(e);
        setErr("No se pudo cargar la información para reservar.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courtId, date, startISO, endISO]);

  // 2) calcular rango seleccionado dentro de los slots del día
  const selection = useMemo(() => {
    if (!daySlots.length) return null;
    const startIdx = daySlots.findIndex((s) => s.start === startISO);
    const endIdx = daySlots.findIndex((s) => s.end === endISO);
    if (startIdx === -1 || endIdx === -1) return null;

    const a = Math.min(startIdx, endIdx);
    const b = Math.max(startIdx, endIdx);
    const slice = daySlots.slice(a, b + 1);

    const allFree = slice.every((s) => s.available);
    const tot = slice.reduce((acc, s) => acc + (typeof s.price_per_slot === "number" ? s.price_per_slot : 0), 0);
    const pricedCount = slice.filter((s) => typeof s.price_per_slot === "number").length;

    return {
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      count: slice.length,
      allFree,
      totalPrice: pricedCount === slice.length ? tot : null,
      currency: slice.find((s) => s.currency)?.currency ?? "ARS",
      items: slice,
      a, b
    };
  }, [daySlots, startISO, endISO]);

  useEffect(() => {
    if (!selection) return;
    const slotsParamNum = Number(slotsCountParam || "0");
    if (slotsParamNum && selection.count !== slotsParamNum) {
      setPriceWarn(`La cantidad de turnos cambió: ${selection.count} seleccionados (antes ${slotsParamNum}).`);
    }
    if (!selection.allFree) {
      setErr("Uno o más horarios ya no están disponibles. Volvé al detalle y elegí otra franja.");
    }
  }, [selection, slotsCountParam]);

  async function handleConfirm() {
    if (!court || !selection) return;

    if (!isAuthenticated()) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    setSubmitting(true);
    setErr(null);

    try {
      // El backend toma el user del token
      const booking = await createBooking({
        court_id: court.id,
        start_datetime: selection.start,
        end_datetime: selection.end,
      });

      navigate(`/booking/confirmation/${booking.id}`);
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 409) setErr("Esa franja fue tomada por otro usuario. Elegí otra.");
      else if (status === 401) setErr("Tenés que iniciar sesión para confirmar.");
      else setErr("No se pudo crear la reserva. Probá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // UI
  if (loading) return <div className="booking-page">Cargando…</div>;
  if (err) {
    return (
      <div className="booking-page">
        <div className="alert error">{err}</div>
        {courtId && date && (
          <Link className="btn" to={`/courts/${courtId}?date=${date}`}>Ver horarios</Link>
        )}
      </div>
    );
  }
  if (!court || !selection) return null;

  return (
    <div className="booking-page">
      <div className="summary-card">
        <h1 className="title">📅 Confirmar reserva</h1>
        <div className="row">
          <div>
            <div className="venue">{court.venue_name} – {court.court_name}</div>
            {court.address && <div className="muted">{court.address}</div>}
          </div>
        </div>

        <div className="grid two">
          <div className="box">
            <div className="label">Fecha</div>
            <div className="value">{fmtDate(date)}</div>
          </div>
          <div className="box">
            <div className="label">Turnos</div>
            <div className="value">{selection.count}</div>
          </div>
        </div>

        <div className="box">
          <div className="label">Horario</div>
          <div className="value">
            {fmtHour(selection.start)} – {fmtHour(selection.end)}
          </div>
        </div>

        <div className="box">
          <div className="label">Detalle</div>
          <ul className="slots-list">
            {selection.items.map((s, i) => (
              <li key={i}>
                <span>{fmtHour(s.start)} – {fmtHour(s.end)}</span>
                {typeof s.price_per_slot === "number" ? (
                  <span className="price">${s.price_per_slot.toLocaleString("es-AR")}</span>
                ) : <span className="muted">—</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="total-row">
          <div className="label">Total estimado</div>
          <div className="total">
            {selection.totalPrice != null
              ? `$${selection.totalPrice.toLocaleString("es-AR")} ${selection.currency || ""}`
              : "Se calcula al confirmar"}
          </div>
        </div>

        {priceWarn && <div className="alert warn">{priceWarn}</div>}

        <div className="actions">
          <Link className="btn" to={`/courts/${court.id}?date=${date}`}>Cambiar horarios</Link>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={!selection.allFree || submitting}
          >
            {submitting ? "Confirmando..." : "Confirmar reserva"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
