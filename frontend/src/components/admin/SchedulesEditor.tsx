import React, { useState } from "react";
import type { SchedulesEditorProps } from "./admin.types";
import { WEEKDAY_LABELS } from "../../api/schedules.api";

export default function SchedulesEditor({ schedules, onCreate, onUpdate, onDelete }: SchedulesEditorProps) {
  const [mode, setMode] = useState<"view"|"create"|"edit">("view");
  const [editingId, setEditingId] = useState<number|null>(null);

  const [form, setForm] = useState<{ weekday: number; open_time: string; close_time: string; slot_minutes: number }>({
    weekday: 0, open_time: "08:00", close_time: "22:00", slot_minutes: 60
  });

  function startEdit(s: any) {
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
