import React, { useEffect, useState } from "react";
import type { Venue } from "../../api/venues.api";
import type { FormVenueInput } from "../../hooks/admin/useOwnerVenues";

export type VenueListProps = {
  venues: Venue[];
  venueId: number | null;
  onSelect: (id: number) => void;

  // hooks: create recibe FormVenueInput, update solo name/lat/lng
  onCreate: (form: FormVenueInput) => Promise<Venue | null>;
  onUpdate: (form: Partial<FormVenueInput>) => void;
  onDelete: () => void;
};

export default function VenueList({
  venues, venueId, onSelect, onCreate, onUpdate, onDelete
}: VenueListProps) {
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const selected = venues.find(v => v.id === venueId) || null;

  // Campos de UI
  const [name, setName] = useState("");

  // Alta (address validation)
  const [country, setCountry] = useState("AR");
  const [streetAndNumber, setStreetAndNumber] = useState("");
  const [optionalLine2, setOptionalLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Edit (coords opcionales)
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  // Cuando entro a editar, cargo name y muestro dirección validada como solo-lectura
  useEffect(() => {
    if (mode === "edit" && selected) {
      setName(selected.name || "");
      setLat(selected.latitude != null ? String(selected.latitude) : "");
      setLng(selected.longitude != null ? String(selected.longitude) : "");
    }
    if (mode === "create") {
      setName("");
      setCountry("AR");
      setStreetAndNumber("");
      setOptionalLine2("");
      setCity("");
      setProvince("");
      setPostalCode("");
      setLat("");
      setLng("");
    }
  }, [mode, selected]);

  const editing = mode !== "view";

  return (
    <div className="venue-list">
      <div className="list" style={{ display: "grid", gap: 6 }}>
        {venues.map(v => (
          <button
            key={v.id}
            className={"btn btn-ghost " + (v.id === venueId ? "active" : "")}
            onClick={() => onSelect(v.id)}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn" onClick={() => setMode("create")}>Nueva sede</button>
        {selected && (
          <>
            <button className="btn btn-ghost" onClick={() => setMode("edit")}>Editar</button>
            <button className="btn btn-ghost" onClick={onDelete}>Eliminar</button>
          </>
        )}
      </div>

      {editing && (
        <form
          className="form-grid"
          style={{ marginTop: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();

            if (mode === "create") {
              // Validaciones mínimas
              if (!streetAndNumber.trim()) return;
              const payload: FormVenueInput = {
                name: name.trim(),
                country,
                streetAndNumber: streetAndNumber.trim(),
                optionalLine2: optionalLine2.trim() || undefined,
                city: city.trim() || null,
                province: province.trim() || null,
                postalCode: postalCode.trim() || null,
                // opcional: si dejás cargar coords manuales en alta
                lat: lat ? Number(lat) : null,
                lng: lng ? Number(lng) : null,
              };
              await onCreate(payload);
            }

            if (mode === "edit") {
              const patch: Partial<FormVenueInput> = { name: name.trim() };
              // Si se completa una coord, exijo ambas (regla de back)
              const latProvided = lat !== "";
              const lngProvided = lng !== "";
              if (latProvided || lngProvided) {
                patch.lat = lat ? Number(lat) : null;
                patch.lng = lng ? Number(lng) : null;
              }
              onUpdate(patch);
            }

            setMode("view");
          }}
        >
          {/* Nombre (siempre) */}
          <label>
            <span>Nombre</span>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>

          {mode === "create" ? (
            <>
              <label>
                <span>País</span>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="AR" />
              </label>
              <label>
                <span>Calle y número</span>
                <input value={streetAndNumber} onChange={e => setStreetAndNumber(e.target.value)} required />
              </label>
              <label>
                <span>Línea 2 (opcional)</span>
                <input value={optionalLine2} onChange={e => setOptionalLine2(e.target.value)} />
              </label>
              <label>
                <span>Ciudad / Localidad</span>
                <input value={city} onChange={e => setCity(e.target.value)} />
              </label>
              <label>
                <span>Provincia / Estado</span>
                <input value={province} onChange={e => setProvince(e.target.value)} />
              </label>
              <label>
                <span>Código Postal</span>
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)} />
              </label>

              {/* Opcional: coords manuales */}
              <label>
                <span>Latitud (opcional)</span>
                <input value={lat} onChange={e => setLat(e.target.value)} inputMode="decimal" />
              </label>
              <label>
                <span>Longitud (opcional)</span>
                <input value={lng} onChange={e => setLng(e.target.value)} inputMode="decimal" />
              </label>
            </>
          ) : (
            selected && (
              <>
                {/* Mostrar dirección validada (solo lectura) */}
                <div className="muted" style={{ gridColumn: "1 / -1", fontSize: 13 }}>
                  <div><strong>Dirección validada:</strong> {selected.address || "—"}</div>
                  <div><strong>Ciudad:</strong> {selected.city || "—"}</div>
                </div>
                {/* Editar coords opcionales */}
                <label>
                  <span>Latitud (opcional)</span>
                  <input
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    inputMode="decimal"
                    placeholder="ej. -34.60"
                  />
                </label>
                <label>
                  <span>Longitud (opcional)</span>
                  <input
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    inputMode="decimal"
                    placeholder="ej. -58.38"
                  />
                </label>
              </>
            )
          )}

          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="submit">Guardar</button>
            <button className="btn btn-ghost" type="button" onClick={() => setMode("view")}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
