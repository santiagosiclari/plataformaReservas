import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCourtPublic,
  getAvailabilityPublic,
  type CourtDetailPublic,
  type AvailabilitySlot,
} from "../../api/courts.api";
import "./courtDetail.css";

function fmtHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const CourtDetailPage: React.FC = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();

  const [court, setCourt] = useState<CourtDetailPublic | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // selección (rango contiguo)
  const [anchorIdx, setAnchorIdx] = useState<number | null>(null);
  const [rangeEndIdx, setRangeEndIdx] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!courtId) return;
      setLoading(true);
      setErr(null);
      try {
        const detail = await getCourtPublic(Number(courtId));
        setCourt(detail);
        const avail = await getAvailabilityPublic(Number(courtId), date);
        setSlots(avail.slots);
      } catch (e) {
        console.error(e);
        setErr("No se pudo cargar la cancha.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courtId, date]);

  // limpiar selección si cambia la fecha o los slots
  useEffect(() => {
    setAnchorIdx(null);
    setRangeEndIdx(null);
  }, [date]);

  const selectedInfo = useMemo(() => {
    if (anchorIdx == null || rangeEndIdx == null) return null;
    const a = Math.min(anchorIdx, rangeEndIdx);
    const b = Math.max(anchorIdx, rangeEndIdx);
    const slice = slots.slice(a, b + 1);
    if (slice.length === 0) return null;
    // validar que todos estén libres
    if (slice.some((s) => !s.available)) return null;

    const startISO = slice[0].start;
    const endISO = slice[slice.length - 1].end;
    // sumar precios (si están definidos)
    const priced = slice.filter((s) => typeof s.price_per_slot === "number") as Array<
      AvailabilitySlot & { price_per_slot: number }
    >;
    const total = priced.reduce((acc, s) => acc + s.price_per_slot, 0);

    const currency = priced[0]?.currency ?? "ARS";
    return {
      startISO,
      endISO,
      slotsCount: slice.length,
      totalPrice: priced.length === slice.length ? total : null,
      currency,
      a,
      b,
    };
  }, [anchorIdx, rangeEndIdx, slots]);

  function handleClickSlot(i: number) {
    const s = slots[i];
    if (!s.available) return; // no seleccionamos ocupados

    if (anchorIdx == null) {
      // primer click -> setea ancla
      setAnchorIdx(i);
      setRangeEndIdx(i);
      return;
    }
    // segundo click (o más): proponemos rango [min,max]
    const a = Math.min(anchorIdx, i);
    const b = Math.max(anchorIdx, i);
    const slice = slots.slice(a, b + 1);
    // si hay ocupados en el medio, no permitimos ese rango
    if (slice.some((x) => !x.available)) {
      // si clickeó sobre el mismo ya seleccionado, reseteamos
      if (i === rangeEndIdx) {
        setAnchorIdx(null);
        setRangeEndIdx(null);
      }
      return;
    }
    setRangeEndIdx(i);
  }

  function clearSelection() {
    setAnchorIdx(null);
    setRangeEndIdx(null);
  }

  function continueBooking() {
    if (!selectedInfo || !courtId) return;
    const params = new URLSearchParams({
      courtId: String(courtId),
      date,
      start: selectedInfo.startISO,
      end: selectedInfo.endISO,
      slots: String(selectedInfo.slotsCount),
    });
    if (selectedInfo.totalPrice != null) {
      params.set("estTotal", String(Math.round(selectedInfo.totalPrice)));
      params.set("currency", selectedInfo.currency || "ARS");
    }
    navigate(`/booking?${params.toString()}`);
  }

  if (loading) return <div className="court-detail">Cargando…</div>;
  if (err) return <div className="court-detail alert error">{err}</div>;
  if (!court) return null;

  return (
    <div className="court-detail">
      <div className="court-header">
        <h1>
          {court.venue_name} – {court.court_name}
        </h1>
        {court.address && <p className="muted">{court.address}</p>}
        <p>
          {String(court.sport)} • {court.surface ?? "—"} •{" "}
          {court.indoor ? "Indoor" : "Outdoor"}
        </p>
      </div>

      {court.lat && court.lng && (
        <div className="map-placeholder">
          <div className="pin">📍</div>
          <div>
            <strong>Ubicación</strong>
            <div>
              Lat: {court.lat.toFixed(5)} • Lng: {court.lng.toFixed(5)}
            </div>
          </div>
        </div>
      )}

      <div className="date-picker">
        <label>Fecha:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Acciones de selección */}
      <div className="selection-bar">
        <div className="selection-summary">
          {selectedInfo ? (
            <>
              <span>
                {fmtHour(selectedInfo.startISO)} – {fmtHour(selectedInfo.endISO)}
              </span>
              <span> • {selectedInfo.slotsCount} hora(s)</span>
              <span>
                {" "}
                • Total{" "}
                {selectedInfo.totalPrice != null
                  ? `$${selectedInfo.totalPrice.toLocaleString("es-AR")}`
                  : "—"}
              </span>
            </>
          ) : (
            <span>Seleccioná uno o más horarios contiguos</span>
          )}
        </div>
        <div className="selection-actions">
          <button className="btn" onClick={clearSelection} disabled={!selectedInfo}>
            Limpiar
          </button>
          <button
            className="btn-primary"
            onClick={continueBooking}
            disabled={!selectedInfo}
          >
            Continuar
          </button>
        </div>
      </div>

      <div className="slots-grid">
        {slots.length === 0 && (
          <p>No hay horarios configurados para esta fecha.</p>
        )}
        {slots.map((s, i) => {
          const isInRange =
            anchorIdx != null &&
            rangeEndIdx != null &&
            i >= Math.min(anchorIdx, rangeEndIdx) &&
            i <= Math.max(anchorIdx, rangeEndIdx) &&
            s.available;

          return (
            <button
              key={i}
              className={`slot ${s.available ? "free" : "busy"} ${
                isInRange ? "selected" : ""
              }`}
              onClick={() => handleClickSlot(i)}
              title={
                s.available
                  ? isInRange
                    ? "Quitar de selección"
                    : "Agregar a selección"
                  : "Ocupado"
              }
            >
              <span>
                {fmtHour(s.start)} – {fmtHour(s.end)}
              </span>
              {typeof s.price_per_slot === "number" && (
                <span className="price">
                  ${s.price_per_slot.toLocaleString("es-AR")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourtDetailPage;
