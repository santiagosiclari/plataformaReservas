import React, { useEffect, useMemo, useState } from "react";
import { searchCourts, type CourtSearchResult } from "../../api/search.api";
import "./search.css";
import { Map, Marker } from "pigeon-maps";

const kmFmt = (v?: number) => {
  if (v == null) return "";
  if (v < 1) return `${Math.round(v * 1000)} m`;
  return `${v.toFixed(v < 10 ? 1 : 0)} km`;
};

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]; // CABA

const SearchPage: React.FC = () => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CourtSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [sport, setSport] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const data = await searchCourts({
          q: q || undefined,
          lat: pos?.lat,
          lng: pos?.lng,
          radius_km: pos ? radiusKm : undefined,
          sport: sport || undefined, // ojo: tu backend usa "PADEL" (no "PADDLE")
          limit: 24,
        });
        setResults(data);
      } catch (e) {
        console.error(e);
        setErr("Error al buscar canchas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [q, pos, radiusKm, sport]);

  function askLocation() {
    if (!navigator.geolocation) {
      setErr("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr("No se pudo obtener tu ubicación.")
    );
  }

  // Construye puntos desde /courts/search (usa lat/lng)
  const mapPoints = useMemo(
    () =>
      results
        .filter(
          (r) =>
            r.lat != null &&
            r.lng != null &&
            Number.isFinite(Number(r.lat)) &&
            Number.isFinite(Number(r.lng))
        )
        .map((r) => ({
          id: r.id, // id de la cancha
          venueId: r.venue_id,
          lat: Number(r.lat),
          lng: Number(r.lng),
          venue_name: r.venue_name,
          address: r.address,
        })),
    [results]
  );

  // Centrado: tu ubicación > primer resultado > default CABA
  const mapCenter: [number, number] =
    pos ? [pos.lat, pos.lng]
    : mapPoints.length ? [mapPoints[0].lat, mapPoints[0].lng]
    : DEFAULT_CENTER;

  return (
    <div className="search-page">
      {/* Barra de búsqueda */}
      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por barrio, sede o deporte…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="search-select"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="FOOTBALL">Fútbol</option>
          <option value="TENNIS">Tenis</option>
          <option value="PADEL">Pádel</option>{/* <- usa PADEL si tu backend así lo guarda */}
        </select>
        <select
          className="search-select"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          disabled={!pos}
        >
          <option value={3}>3 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
        </select>
        <button className="btn" onClick={askLocation} aria-label="Usar mi ubicación">
          📍 Usar ubicación
        </button>
      </div>

      {err && <div className="alert error">{err}</div>}

      {/* Mapa con Pigeon */}
      <div style={{ height: 380, width: "100%", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <Map defaultCenter={mapCenter} defaultZoom={12} height={380}>
          {mapPoints.map((p) => (
            <Marker
              key={`${p.id}-${p.lat}-${p.lng}`}
              width={32}
              anchor={[p.lat, p.lng]}
              onClick={() => (window.location.href = `/courts/${p.id}`)}
            />
          ))}
        </Map>
      </div>

      {/* Resumen y cards */}
      <div className="search-summary">
        {loading ? "Buscando…" : `${results.length} resultados`}
        {pos && !loading && <span className="muted"> cerca tuyo</span>}
      </div>

      <ul className="cards-grid">
        {results.map((c) => (
          <li
            key={c.id}
            className="court-card"
            onClick={() => (window.location.href = `/courts/${c.id}`)}
          >
            <div className="thumb">
              {c.photo_url ? (
                <img src={c.photo_url} alt={c.court_name} />
              ) : (
                <div className="thumb-fallback">🏟️</div>
              )}
            </div>
            <div className="card-body">
              <h3 className="card-title">{c.venue_name}</h3>
              <p className="card-sub">
                {c.court_name} • {c.sport.toLowerCase()}
              </p>
              {typeof c.distance_km === "number" && (
                <p className="muted">{kmFmt(c.distance_km)} de distancia</p>
              )}
              {c.address && <p className="muted">{c.address}</p>}
              <div className="card-footer">
                <div className="price">
                  {typeof c.price_hint === "number"
                    ? `Desde $${Math.round(c.price_hint)}`
                    : "Consultar precio"}
                </div>
                <button className="btn-primary">Ver detalles</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchPage;
