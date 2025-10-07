import React, { useEffect, useState } from "react";
import type { VenueListProps } from "./admin.types";

export default function VenueList({ venues, venueId, onSelect, onCreate, onUpdate, onDelete }: VenueListProps) {
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const selected = venues.find(v => v.id === venueId) || null;
  const [name, setName] = useState(""); const [address, setAddress] = useState("");const [city, setCity] = useState("");

  useEffect(() => {
    if (mode === "edit" && selected) { setName(selected.name || ""); setAddress(selected.address || ""); setCity(selected.city || "")}
    if (mode === "create") { setName(""); setAddress(""); setCity("")}
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
          const payload = { name: name.trim(), address: address.trim(), city: city.trim() };

          if (mode === "create") onCreate(payload);
          if (mode === "edit") onUpdate(payload);
          setMode("view");
        }}>
          <label>
            <span>Nombre</span>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            <span>Dirección</span>
            <input value={address} onChange={e => setAddress(e.target.value)} required />
          </label>
          <label>
            <span>Ciudad</span> {/* 👈 nuevo campo */}
            <input value={city} onChange={e => setCity(e.target.value)} required />
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
