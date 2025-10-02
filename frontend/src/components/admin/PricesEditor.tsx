import React, { useEffect, useState } from "react";
import type { PricesEditorProps } from "./admin.types";
import { DOW } from "./admin.constants";

export default function PricesEditor({ prices, onCreate, onUpdate, onDelete }: PricesEditorProps) {
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

  function startEdit(p: any) {
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
