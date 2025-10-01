import React, { useEffect, useMemo, useState } from "react";
import {
    createVenue,
    updateVenue,
    deleteVenue,
    listOwnedVenues
} from "../../api/venues.api"
import {
    createCourt,
    updateCourt,
    deleteCourt,
    listCourtsByVenue
} from "../../api/courts.api"
import {
    listPrices,
    createPrice,
    updatePrice,
    deletePrice
} from "../../api/prices.api"
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type CourtSchedule,
  type CreateCourtScheduleDTO,
  type UpdateCourtScheduleDTO,
  WEEKDAY_LABELS
} from "../../api/schedules.api";

import type { Price, CreatePriceDTO, UpdatePriceDTO } from "../../api/prices.api";
import type { Court, CreateCourtDTO, UpdateCourtDTO, Sport } from "../../api/courts.api";
import type { Venue, VenueCreate, VenueUpdate } from "../../api/venues.api";
import "./adminManage.css";

/**
 * AdminManagePage
 * Permite a OWNER administrar sus Venues, sus Courts y los Precios de cada court.
 */

const SPORT_LABEL: Record<string, string> = {
  FOOTBALL: "Fútbol",
  TENNIS: "Tenis",
  PADDLE: "Padel",
  BASKET: "Basquet",
  VOLLEY: "Voley",
};

const SURFACE_LABEL: Record<string, string> = {
  CLAY: "Polvo de ladrillo",
  HARD: "Cemento / Hard",
  GRASS: "Césped",
  SYNTHETIC_TURF: "Sintético",
  PARQUET: "Parquet",
  SAND: "Arena",
  OTHER: "Otra",
};

const SURFACES_BY_SPORT: Record<string, Array<keyof typeof SURFACE_LABEL>> = {
  TENNIS: ["CLAY", "HARD", "GRASS", "OTHER"],
  PADEL: ["SYNTHETIC_TURF", "HARD", "OTHER"],
  FOOTBALL: ["SYNTHETIC_TURF", "GRASS", "OTHER"],
  BASKET: ["PARQUET", "HARD", "OTHER"],
  VOLLEY: ["SAND", "HARD", "OTHER"],
};

const DEFAULT_COURT_NUMBERS = Array.from({ length: 20 }, (_, i) => String(i + 1));

// 0 = Lunes … 6 = Domingo
const DOW = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

export default function AdminManagePage() {
  // Estado principal
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);

  const [schedules, setSchedules] = useState<CourtSchedule[]>([]);

  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Cargar venues del owner
  useEffect(() => {
    (async () => {
      try {
        const vs = await listOwnedVenues();
        setVenues(vs);
        if (vs.length && !venueId) setVenueId(vs[0].id);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Cargar courts al elegir venue
  useEffect(() => {
    (async () => {
      if (!venueId) { setCourts([]); setCourtId(null); setPrices([]); return; }
      try {
        const cs = await listCourtsByVenue(venueId);
        setCourts(cs);
        if (cs.length) setCourtId(cs[0].id);
      } catch (e) { console.error(e); }
    })();
  }, [venueId]);

  // Cargar precios al elegir court
  useEffect(() => {
    (async () => {
      if (!venueId || !courtId) { setPrices([]); return; }
      try {
        const ps = await listPrices(venueId, courtId);
        setPrices(ps);
      } catch (e) { console.error(e); }
    })();
  }, [venueId, courtId]);

  useEffect(() => {
    (async () => {
      if (!courtId) { setSchedules([]); return; }
      try {
        const sc = await listSchedules(courtId);
        setSchedules(sc);
      } catch (e) { console.error(e); }
    })();
  }, [courtId]);

    // ===== Handlers Schedule =====
  async function handleCreateSchedule(s: CreateCourtScheduleDTO) {
    if (!courtId) return;
    setLoading(true); setMsg(null);
    try {
      await createSchedule(courtId, s);
      const sc = await listSchedules(courtId);
      setSchedules(sc);
      setMsg("Horario creado ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo crear el horario");
    } finally { setLoading(false); }
  }
  
  async function handleUpdateSchedule(id: number, s: UpdateCourtScheduleDTO) {
    if (!courtId) return;
    setLoading(true); setMsg(null);
    try {
      await updateSchedule(courtId, id, s);
      const sc = await listSchedules(courtId);
      setSchedules(sc);
      setMsg("Horario actualizado ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo actualizar el horario");
    } finally { setLoading(false); }
  }
  
  async function handleDeleteSchedule(id: number) {
    if (!courtId) return;
    if (!confirm("¿Eliminar este horario?")) return;
    setLoading(true); setMsg(null);
    try {
      await deleteSchedule(courtId, id);
      const sc = await listSchedules(courtId);
      setSchedules(sc);
      setMsg("Horario eliminado ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo eliminar el horario");
    } finally { setLoading(false); }
  }

  // ===== Handlers Venues =====
  async function handleCreateVenue(v: VenueCreate) {
    setLoading(true); setMsg(null);
    try {
      const created = await createVenue(v);
      const vs = await listOwnedVenues();
      setVenues(vs);
      setVenueId(created.id);
      setMsg("Sede creada ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo crear la sede");
    } finally { setLoading(false); }
  }
  
  async function handleUpdateVenue(v: VenueUpdate) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try {
      await updateVenue(venueId, v);
      const vs = await listOwnedVenues();
      setVenues(vs);
      setMsg("Sede actualizada ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo actualizar la sede");
    } finally { setLoading(false); }
  }
  

  async function handleDeleteVenue() {
    if (!venueId) return;
    if (!confirm("¿Eliminar la sede y todos sus courts? Esta acción no se puede deshacer.")) return;
    setLoading(true); setMsg(null);
    try {
      await deleteVenue(venueId);
      const vs = await listOwnedVenues();
      setVenues(vs);
      setVenueId(vs[0]?.id ?? null);
      setMsg("Sede eliminada ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo eliminar la sede");
    } finally { setLoading(false); }
  }

  // ===== Handlers Courts =====
  async function handleCreateCourt(c: CreateCourtDTO) {
    if (!venueId) return;
    setLoading(true); setMsg(null);
    try {
      await createCourt(venueId, c);                 // ✅ ahora recibe CreateCourtDTO
      const cs = await listCourtsByVenue(venueId);
      setCourts(cs);
      setCourtId(cs[cs.length - 1]?.id ?? null);
      setMsg("Cancha creada ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo crear la cancha");
    } finally { setLoading(false); }
  }
  
  async function handleUpdateCourt(c: UpdateCourtDTO) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try {
      await updateCourt(venueId, courtId, c);        // ✅ UpdateCourtDTO
      const cs = await listCourtsByVenue(venueId);
      setCourts(cs);
      setMsg("Cancha actualizada ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo actualizar la cancha");
    } finally { setLoading(false); }
  }
  

  async function handleDeleteCourt() {
    if (!venueId || !courtId) return;
    if (!confirm("¿Eliminar la cancha? Esto borrará sus precios y posibles configuraciones asociadas.")) return;
    setLoading(true); setMsg(null);
    try {
      await deleteCourt(venueId, courtId);
      const cs = await listCourtsByVenue(venueId);
      setCourts(cs);
      setCourtId(cs[0]?.id ?? null);
      setMsg("Cancha eliminada ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo eliminar la cancha");
    } finally { setLoading(false); }
  }

  // ===== Handlers Prices =====
  async function handleCreatePrice(p: CreatePriceDTO) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try {
      await createPrice(venueId, courtId, p);
      const ps = await listPrices(venueId, courtId);
      setPrices(ps);
      setMsg("Precio creado ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo crear el precio");
    } finally { setLoading(false); }
  }
  
  async function handleUpdatePrice(priceId: number, p: UpdatePriceDTO) {
    if (!venueId || !courtId) return;
    setLoading(true); setMsg(null);
    try {
      await updatePrice(venueId, courtId, priceId, p);
      const ps = await listPrices(venueId, courtId);
      setPrices(ps);
      setMsg("Precio actualizado ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo actualizar el precio");
    } finally { setLoading(false); }
  }
  

  async function handleDeletePrice(priceId: number) {
    if (!venueId || !courtId) return;
    if (!confirm("¿Eliminar este precio?")) return;
    setLoading(true); setMsg(null);
    try {
      await deletePrice(venueId, courtId, priceId);
      const ps = await listPrices(venueId, courtId);
      setPrices(ps);
      setMsg("Precio eliminado ✔");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo eliminar el precio");
    } finally { setLoading(false); }
  }


  const selectedVenue = useMemo(() => venues.find(v => v.id === venueId) || null, [venues, venueId]);
  const selectedCourt  = useMemo(() => courts.find(c => c.id === courtId) || null, [courts, courtId]);

  return (
    <div className="admin-page" style={{ gridTemplateColumns: "280px 1fr" }}>
      <div className="panel" style={{ height: "fit-content" }}>
        <div className="panel-header">Sedes</div>
        <VenueList
          venues={venues}
          venueId={venueId}
          onSelect={setVenueId}
          onCreate={handleCreateVenue}
          onUpdate={handleUpdateVenue}
          onDelete={handleDeleteVenue}
        />
      </div>

      <div className="panel" style={{ display: "grid", gap: 12 }}>
        <div className="panel-header">Detalle</div>

        <section>
          <h3 className="section-title">Cancha</h3>
          <CourtSelector
            courts={courts}
            courtId={courtId}
            onSelect={setCourtId}
            onCreate={handleCreateCourt}
            onUpdate={handleUpdateCourt}
            onDelete={handleDeleteCourt}
          />
        </section>

        <section>
          <h3 className="section-title">Precios</h3>
          {selectedCourt ? (
            <PricesEditor
              prices={prices}
              onCreate={handleCreatePrice}
              onUpdate={handleUpdatePrice}
              onDelete={handleDeletePrice}
            />
          ) : (
            <p className="muted">Elegí una cancha para gestionar sus precios.</p>
          )}
        </section>

        <section>
          <h3 className="section-title">Horarios</h3>
          {selectedCourt ? (
            <SchedulesEditor
              schedules={schedules}
              onCreate={handleCreateSchedule}
              onUpdate={handleUpdateSchedule}
              onDelete={handleDeleteSchedule}
            />
          ) : (
            <p className="muted">Elegí una cancha para gestionar sus horarios.</p>
          )}
        </section>


        {msg && <p className="hint">{msg}</p>}
        {loading && <div className="loading">Guardando…</div>}
      </div>
    </div>
  );
}

// ================== COMPONENTES ==================

function VenueList({
    venues, venueId, onSelect, onCreate, onUpdate, onDelete
  }: {
    venues: Venue[];
    venueId: number | null;
    onSelect: (id: number) => void;
    onCreate: (v: VenueCreate) => void;
    onUpdate: (v: VenueUpdate) => void;
    onDelete: () => void;
  }) {
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const selected = venues.find(v => v.id === venueId) || null;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (mode === "edit" && selected) {
      setName(selected.name || "");
      setAddress(selected.address || "");
    }
    if (mode === "create") {
      setName(""); setAddress("");
    }
  }, [mode, selected]);

  return (
    <div className="venue-list">
      <div className="list" style={{ display: "grid", gap: 6 }}>
        {venues.map(v => (
          <button key={v.id}
            className={"btn btn-ghost " + (v.id === venueId ? "active" : "")}
            onClick={() => onSelect(v.id)}>
            {v.name}
          </button>
        ))}
      </div>

      <div className="actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn" onClick={() => setMode("create")}>Nueva sede</button>
        {selected && <>
          <button className="btn btn-ghost" onClick={() => setMode("edit")}>Editar</button>
          <button className="btn btn-ghost" onClick={onDelete}>Eliminar</button>
        </>}
      </div>

      {mode !== "view" && (
        <form className="form-grid" style={{ marginTop: 12 }} onSubmit={(e) => {
          e.preventDefault();
          if (mode === "create") onCreate({ name, address });
          if (mode === "edit") onUpdate({ name, address });
          setMode("view");
        }}>
          <label>
            <span>Nombre</span>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            <span>Dirección</span>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Opcional" />
          </label>
          <div className="form-actions">
            <button className="btn" type="submit">Guardar</button>
            <button className="btn btn-ghost" type="button" onClick={() => setMode("view")}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

function CourtSelector({
  courts, courtId, onSelect, onCreate, onUpdate, onDelete
}: {
  courts: Court[];
  courtId: number | null;
  onSelect: (id: number) => void;
  onCreate: (c: CreateCourtDTO) => void;
  onUpdate: (c: UpdateCourtDTO) => void;
  onDelete: () => void;
}) {
  const selected = courts.find(c => c.id === courtId) || null;

  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [form, setForm] = useState<CreateCourtDTO>({
    sport: "TENNIS",
    indoor: false,
    number: "",
    surface: undefined as any,
    notes: ""
  });
  const [error, setError] = useState<string | null>(null);

  // Números usados en el venue
  const usedNumbers = useMemo(() => {
    const set = new Set<string>();
    for (const c of courts) if (c.number) set.add(String(c.number));
    return set;
  }, [courts]);

  // Opciones de superficie según deporte
  const surfaceOptions = useMemo(() => {
    const s = SURFACES_BY_SPORT[form.sport] || ["OTHER"];
    return s;
  }, [form.sport]);

  useEffect(() => {
    if (mode === "edit" && selected) {
      setForm({
        sport: selected.sport as Sport,
        indoor: !!selected.indoor,
        number: selected.number ?? "",
        surface: (selected.surface as any) ?? undefined,
        notes: selected.notes ?? ""
      });
      setError(null);
    }
    if (mode === "create") {
      setForm({ sport: "TENNIS", indoor: false, number: "", surface: undefined as any, notes: "" });
      setError(null);
    }
  }, [mode, selected]);

  // Validación: número repetido (permití el actual si estás editando)
  const isNumberTaken = (num: string) => {
    if (!num) return false;
    if (mode === "edit" && selected?.number === num) return false;
    return usedNumbers.has(num);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.number && isNumberTaken(form.number)) {
      setError("Ese número ya está usado en esta sede.");
      return;
    }
    setError(null);
    if (mode === "create") onCreate(form);
    if (mode === "edit") onUpdate({ ...form });
    setMode("view");
  }

  // Opciones de número: deshabilitar las ya usadas
  const numberOptions = DEFAULT_COURT_NUMBERS.map(n => ({
    value: n,
    label: `#${n}`,
    disabled: isNumberTaken(n),
  }));

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>Cancha seleccionada</div>
          <strong>{selected ? `#${selected.number || "s/n"} · ${SPORT_LABEL[selected.sport] || selected.sport}` : "Ninguna"}</strong>
        </div>
        <div className="actions" style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setMode("create")}>Nueva</button>
          {selected && <>
            <button className="btn btn-ghost" onClick={() => setMode("edit")}>Editar</button>
            <button className="btn btn-ghost" onClick={onDelete}>Eliminar</button>
          </>}
        </div>
      </div>

      {mode !== "view" && (
        <form onSubmit={submit} className="form-grid">
          <label>
            <span>Deporte</span>
            <select
              value={form.sport}
              onChange={e => setForm({ ...form, sport: e.target.value as Sport, surface: undefined as any })}
              required
            >
              <option value="TENNIS">Tenis</option>
              <option value="PADEL">Pádel</option>
              <option value="FOOTBALL">Fútbol</option>
              <option value="BASKET">Básquet</option>
              <option value="VOLLEY">Vóley</option>
            </select>
          </label>

          <label>
            <span>Número</span>
            <select
              value={form.number ?? ""}
              onChange={e => setForm({ ...form, number: e.target.value })}
            >
              <option value="">— s/n —</option>
              {numberOptions.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}{opt.disabled ? " (usado)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Superficie</span>
            <select
              value={form.surface ?? ""}
              onChange={e => setForm({ ...form, surface: (e.target.value || undefined) as any })}
              required
            >
              <option value="">Elegí una superficie…</option>
              {surfaceOptions.map(sv => (
                <option key={sv} value={sv}>{SURFACE_LABEL[sv]}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Interior</span>
            <input
              type="checkbox"
              checked={!!form.indoor}
              onChange={e => setForm({ ...form, indoor: e.target.checked })}
            />
          </label>

          <label className="col-span-2">
            <span>Notas</span>
            <textarea
              value={form.notes ?? ""}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Ej: Tiene luz LED, tribuna, etc."
            />
          </label>

          {error && <div className="error">{error}</div>}

          <div className="form-actions col-span-2">
            <button className="btn" type="submit">Guardar</button>
            <button className="btn btn-ghost" type="button" onClick={() => setMode("view")}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista rápida de canchas para seleccionar */}
      <div className="list" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {courts.map(c => (
          <button
            key={c.id}
            className={"chip " + (c.id === courtId ? "active" : "")}
            onClick={() => onSelect(c.id)}
            title={`${SPORT_LABEL[c.sport] || c.sport} · ${c.surface ? SURFACE_LABEL[c.surface] : "—"}`}
          >
            #{c.number || "s/n"} · {SPORT_LABEL[c.sport] || c.sport}
          </button>
        ))}
        {courts.length === 0 && <div className="muted">No hay canchas aún.</div>}
      </div>
    </div>
  );
}

function PricesEditor({ prices, onCreate, onUpdate, onDelete }: {
  prices: Price[];
  onCreate: (p: CreatePriceDTO) => void;
  onUpdate: (id: number, p: UpdatePriceDTO) => void;
  onDelete: (id: number) => void;
}) {
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [editingId, setEditingId] = useState<number | null>(null);

  type PriceForm = { weekday: number; start_time: string; end_time: string; price_per_slot: number };
  const [form, setForm] = useState<PriceForm>({
    weekday: 0, start_time: "08:00", end_time: "09:00", price_per_slot: 0
  });

  useEffect(() => {
    if (mode === "create") {
      setForm({ weekday: 0, start_time: "08:00", end_time: "09:00", price_per_slot: 0 });
    }
  }, [mode]);

  function startEdit(p: Price) {
    setEditingId(p.id);
    const toHHMM = (t: string) => t.slice(0,5);
    setForm({
      weekday: p.weekday,
      start_time: toHHMM(p.start_time),
      end_time: toHHMM(p.end_time),
      price_per_slot: p.price_per_slot,
    });
    setMode("edit");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create") onCreate(form);
    if (mode === "edit" && editingId != null) onUpdate(editingId, form);
    setMode("view"); setEditingId(null);
  }

  const showHHMM = (t: string) => t.slice(0,5);

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="top-table sticky">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Día</th>
              <th style={{ width: 90 }}>Desde</th>
              <th style={{ width: 90 }}>Hasta</th>
              <th style={{ textAlign: "right", width: 120 }}>Precio</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, idx) => (
              <tr key={p.id} className={idx % 2 ? "zebra" : ""}>
                <td>{DOW[p.weekday]}</td>
                <td>{showHHMM(p.start_time)}</td>
                <td>{showHHMM(p.end_time)}</td>
                <td className="price-cell">
                  {Number(p.price_per_slot).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                </td>
                <td className="row-actions">
                  <button className="btn btn-ghost" onClick={() => startEdit(p)}>Editar</button>
                  <button className="btn btn-ghost" onClick={() => onDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                  No hay precios definidos. Agregá el primero 👇
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        {mode === "view" ? (
          <button className="btn" onClick={() => setMode("create")}>Agregar precio</button>
        ) : (
          <form className="form-grid" onSubmit={submit}>
            <label>
              <span>Día</span>
              <select
                value={String(form.weekday)}
                onChange={e => setForm({ ...form, weekday: Number(e.target.value) })}
              >
                {DOW.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </label>
            <label>
              <span>Desde</span>
              <input type="time" value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })} required />
            </label>
            <label>
              <span>Hasta</span>
              <input type="time" value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })} required />
            </label>
            <label>
              <span>Precio (ARS)</span>
              <input
                type="number" min={0} step={50} inputMode="numeric" placeholder="0"
                value={form.price_per_slot}
                onChange={e => setForm({ ...form, price_per_slot: Number(e.target.value) })}
                className="price-input"
                required
              />
            </label>
            <div className="form-actions">
              <button className="btn" type="submit">Guardar</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setMode("view"); setEditingId(null); }}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
function SchedulesEditor({ schedules, onCreate, onUpdate, onDelete }: {
  schedules: CourtSchedule[];
  onCreate: (s: CreateCourtScheduleDTO) => void;
  onUpdate: (id: number, s: UpdateCourtScheduleDTO) => void;
  onDelete: (id: number) => void;
}) {
  const [mode, setMode] = useState<"view"|"create"|"edit">("view");
  const [editingId, setEditingId] = useState<number|null>(null);

  const [form, setForm] = useState<CreateCourtScheduleDTO>({
    weekday: 0, open_time: "08:00", close_time: "22:00", slot_minutes: 60
  });

  function startEdit(s: CourtSchedule) {
    setEditingId(s.id);
    setForm({
      weekday: s.weekday,
      open_time: s.open_time.slice(0,5),
      close_time: s.close_time.slice(0,5),
      slot_minutes: s.slot_minutes,
    });
    setMode("edit");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create") onCreate(form);
    if (mode === "edit" && editingId) onUpdate(editingId, form);
    setMode("view"); setEditingId(null);
  }

  return (
    <div className="card">
      <table className="top-table sticky">
        <thead>
          <tr>
            <th>Día</th><th>Abre</th><th>Cierra</th><th>Slot</th><th></th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s, idx) => (
            <tr key={s.id} className={idx % 2 ? "zebra" : ""}>
              <td>{WEEKDAY_LABELS[s.weekday]}</td>
              <td>{s.open_time.slice(0,5)}</td>
              <td>{s.close_time.slice(0,5)}</td>
              <td>{s.slot_minutes} min</td>
              <td>
                <button className="btn btn-ghost" onClick={() => startEdit(s)}>Editar</button>
                <button className="btn btn-ghost" onClick={() => onDelete(s.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {schedules.length === 0 && (
            <tr><td colSpan={5} className="muted">No hay horarios definidos</td></tr>
          )}
        </tbody>
      </table>

      {mode !== "view" && (
        <form className="form-grid" onSubmit={submit}>
          <label>
            <span>Día</span>
            <select value={form.weekday}
              onChange={e => setForm({ ...form, weekday: Number(e.target.value) })}>
              {WEEKDAY_LABELS.map((d,i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
          <label>
            <span>Abre</span>
            <input type="time" value={form.open_time}
              onChange={e => setForm({ ...form, open_time: e.target.value })}/>
          </label>
          <label>
            <span>Cierra</span>
            <input type="time" value={form.close_time}
              onChange={e => setForm({ ...form, close_time: e.target.value })}/>
          </label>
          <label>
            <span>Slot (min)</span>
            <input type="number" min={15} step={15} value={form.slot_minutes ?? 60}
              onChange={e => setForm({ ...form, slot_minutes: Number(e.target.value) })}/>
          </label>
          <div className="form-actions col-span-2">
            <button className="btn" type="submit">Guardar</button>
            <button className="btn btn-ghost" type="button"
              onClick={() => { setMode("view"); setEditingId(null); }}>Cancelar</button>
          </div>
        </form>
      )}

      {mode === "view" && (
        <button className="btn" onClick={() => setMode("create")}>Agregar horario</button>
      )}
    </div>
  );
}
