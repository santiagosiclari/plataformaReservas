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
import type { Price, CreatePriceDTO, UpdatePriceDTO } from "../../api/prices.api";
import type { Court, CreateCourtDTO, UpdateCourtDTO, Sport } from "../../api/courts.api";
import type { Venue, VenueCreate, VenueUpdate } from "../../api/venues.api";
import "./admin.css";

/**
 * AdminManagePage
 * Permite a OWNER administrar sus Venues, sus Courts y los Precios de cada court.
 */

// ==== Tipos locales (ajustá a tu backend si cambia) ====

const SPORT_LABEL: Record<string, string> = {
  FOOTBALL: "Fútbol",
  TENNIS: "Tenis",
  PADDLE: "Pádel",
  BASKET: "Básquet",
  VOLLEY: "Vóley",
};

// 0 = Lunes … 6 = Domingo
const DOW = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

export default function AdminManagePage() {
  // Estado principal
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);


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
    onCreate: (c: CreateCourtDTO) => void; // ✅
    onUpdate: (c: UpdateCourtDTO) => void; // ✅
    onDelete: () => void;
  }) {
    const selected = courts.find(c => c.id === courtId) || null;
  
    const [mode, setMode] = useState<"view" | "create" | "edit">("view");
    const [form, setForm] = useState<CreateCourtDTO>({
      sport: "TENNIS",        // 👈 requerido
      indoor: false,          // opcional, default false
      number: "",
      surface: "",
      notes: ""
    });
  
    useEffect(() => {
      if (mode === "edit" && selected) {
        // para editar, podés rellenar con los datos actuales
        setForm({
          sport: selected.sport as Sport,
          indoor: !!selected.indoor,
          number: selected.number ?? "",
          surface: selected.surface ?? "",
          notes: selected.notes ?? ""
        });
      }
      if (mode === "create") {
        setForm({ sport: "TENNIS", indoor: false, number: "", surface: "", notes: "" });
      }
    }, [mode, selected]);
  
    function submit(e: React.FormEvent) {
      e.preventDefault();
      if (mode === "create") onCreate(form);                    // ✅ CreateCourtDTO (sport presente)
      if (mode === "edit")   onUpdate({ ...form });             // ✅ UpdateCourtDTO (parcial permitido)
      setMode("view");
    }
  
    return (
      <form onSubmit={submit} className="form-grid" style={{ marginTop: 12 }}>
        <label>
          <span>Deporte</span>
          <select
            value={form.sport}
            onChange={e => setForm({ ...form, sport: e.target.value as Sport })}
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
          <input value={form.number ?? ""} onChange={e => setForm({ ...form, number: e.target.value })} />
        </label>
        <label>
          <span>Superficie</span>
          <input value={form.surface ?? ""} onChange={e => setForm({ ...form, surface: e.target.value })} />
        </label>
        <label>
          <span>Interior</span>
          <input type="checkbox" checked={!!form.indoor} onChange={e => setForm({ ...form, indoor: e.target.checked })} />
        </label>
        <label className="col-span-2">
          <span>Notas</span>
          <textarea value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
        </label>
        <div className="form-actions col-span-2">
          <button className="btn" type="submit">Guardar</button>
          <button className="btn btn-ghost" type="button" onClick={() => setMode("view")}>Cancelar</button>
        </div>
      </form>
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
      // los times del back pueden venir "HH:MM:SS" → recorto a "HH:MM" para el <input type="time">
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
      <div className="prices-editor">
        <table className="top-table">
          <thead>
            <tr>
              <th>Día</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th style={{ textAlign: "right" }}>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prices.map(p => (
              <tr key={p.id}>
                <td>{DOW[p.weekday]}</td>
                <td>{showHHMM(p.start_time)}</td>
                <td>{showHHMM(p.end_time)}</td>
                <td style={{ textAlign: "right" }}>
                  {Number(p.price_per_slot).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost" onClick={() => startEdit(p)}>Editar</button>
                  <button className="btn btn-ghost" onClick={() => onDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr><td colSpan={5} className="muted">Sin precios definidos para esta cancha.</td></tr>
            )}
          </tbody>
        </table>
  
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
                <span>Precio</span>
                <input type="number" min={0} step={50} value={form.price_per_slot}
                  onChange={e => setForm({ ...form, price_per_slot: Number(e.target.value) })} required />
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
  