import React, { useEffect, useMemo, useState } from "react";
import type { CourtSelectorProps, Sport, CreateCourtDTO, UpdateCourtDTO } from "./admin.types";
import { SURFACES_BY_SPORT, SURFACE_LABEL, DEFAULT_COURT_NUMBERS, SPORT_LABEL } from "./admin.constants";

export default function CourtSelector({
  courts, courtId, onSelect, onCreate, onUpdate, onDelete
}: CourtSelectorProps) {
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
    if (mode === "edit") onUpdate({ ...form } as UpdateCourtDTO);
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
