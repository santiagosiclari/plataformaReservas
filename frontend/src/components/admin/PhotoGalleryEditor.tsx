import React, { useEffect, useState } from "react";

type Photo = {
  id: number;
  url: string;
  alt_text?: string | null;
  is_cover: boolean;
  sort_order: number;
};

export type PhotoGalleryEditorProps = {
  title?: string;
  photos: Photo[];
  onCreate: (p: { url: string; alt_text?: string | null; is_cover?: boolean; sort_order?: number }) => void;
  onUpdate: (id: number, p: Partial<Photo>) => void;
  onDelete: (id: number) => void;
  canSetCover?: boolean;
};

export default function PhotoGalleryEditor({
  title = "Fotos",
  photos,
  onCreate,
  onUpdate,
  onDelete,
  canSetCover = true,
}: PhotoGalleryEditorProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => { /* noop */ }, [photos]);

  function add() {
    if (!url.trim()) return;
    const sort_order = photos.length; // agrega al final
    onCreate({ url: url.trim(), alt_text: alt || undefined, is_cover: photos.length === 0, sort_order });
    setUrl(""); setAlt("");
  }

  function move(id: number, dir: -1 | 1) {
    const idx = photos.findIndex(p => p.id === id);
    if (idx < 0) return;
    const otherIdx = idx + dir;
    if (otherIdx < 0 || otherIdx >= photos.length) return;
    const a = photos[idx], b = photos[otherIdx];
    // swap sort_order
    onUpdate(a.id, { sort_order: b.sort_order });
    onUpdate(b.id, { sort_order: a.sort_order });
  }

  function setCover(id: number) {
    onUpdate(id, { is_cover: true });
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h4 className="section-title" style={{ margin: 0 }}>{title}</h4>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        {photos.map((p, i) => (
          <div key={p.id} className="photo-item" style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 8, alignItems: "center" }}>
            <img src={p.url} alt={p.alt_text || ""} style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
            <div style={{ display: "grid", gap: 6 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                #{p.sort_order} {p.is_cover ? "· Portada" : ""}
              </div>
              <input
                placeholder="Texto alternativo (alt)"
                value={p.alt_text || ""}
                onChange={e => onUpdate(p.id, { alt_text: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost" onClick={() => move(p.id, -1)} title="Subir">↑</button>
              <button className="btn btn-ghost" onClick={() => move(p.id, +1)} title="Bajar">↓</button>
              {canSetCover && !p.is_cover && (
                <button className="btn btn-ghost" onClick={() => setCover(p.id)} title="Marcar portada">★</button>
              )}
              <button className="btn btn-ghost" onClick={() => onDelete(p.id)} title="Eliminar">🗑️</button>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="muted" style={{ gridColumn: "1 / -1" }}>No hay fotos aún.</p>}
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <label className="col-span-2">
          <span>Nueva foto (URL)</span>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label className="col-span-2">
          <span>Alt text (opcional)</span>
          <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Descripción para accesibilidad" />
        </label>
        <div className="form-actions col-span-2">
          <button className="btn" type="button" onClick={add}>Agregar</button>
        </div>
      </div>
    </div>
  );
}
