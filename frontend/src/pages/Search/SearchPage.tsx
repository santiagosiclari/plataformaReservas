import React, { useEffect, useMemo, useState } from "react";
import { searchCourts, type CourtSearchResult } from "../../api/search.api";
import "./search.css";
import { Map, Marker } from "pigeon-maps";

// MUI
import { Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button, Alert, Typography } from "@mui/material";

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
          sport: sport || undefined, // Backend usa "PADEL"
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

  // puntos para el mapa
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
          id: r.id,
          venueId: r.venue_id,
          lat: Number(r.lat),
          lng: Number(r.lng),
          venue_name: r.venue_name,
          address: r.address,
        })),
    [results]
  );

  const mapCenter: [number, number] =
    pos ? [pos.lat, pos.lng]
    : mapPoints.length ? [mapPoints[0].lat, mapPoints[0].lng]
    : DEFAULT_CENTER;

  return (
    <div className="search-page">
      {/* Barra de búsqueda (grid via .search-bar) */}
      <div className="search-bar">
        <TextField
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por barrio, sede o deporte…"
          label="Búsqueda"
          fullWidth
          size="medium"
          variant="outlined"
        />

        <FormControl fullWidth>
          <InputLabel id="sport-label">Deporte</InputLabel>
          <Select
            labelId="sport-label"
            label="Deporte"
            value={sport}
            onChange={(e) => setSport(String(e.target.value))}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="FOOTBALL">Fútbol</MenuItem>
            <MenuItem value="TENNIS">Tenis</MenuItem>
            <MenuItem value="PADEL">Pádel</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!pos}>
          <InputLabel id="radius-label">Radio</InputLabel>
          <Select
            labelId="radius-label"
            label="Radio"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            <MenuItem value={3}>3 km</MenuItem>
            <MenuItem value={5}>5 km</MenuItem>
            <MenuItem value={10}>10 km</MenuItem>
          </Select>
        </FormControl>

        <Button
          onClick={askLocation}
          variant="outlined"
          fullWidth
          aria-label="Usar mi ubicación"
        >
          📍 Usar ubicación
        </Button>
      </div>

      {err && <Alert severity="error">{err}</Alert>}

      {/* Mapa */}
      <div style={{ height: 380, width: "100%", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid var(--border)" }}>
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

      {/* Resumen */}
      <div className="search-summary">
        {loading ? "Buscando…" : `${results.length} resultados`}
        {pos && !loading && <span className="muted"> cerca tuyo</span>}
      </div>

      {/* Cards */}
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
