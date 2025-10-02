import React, { useMemo, useState } from "react";
import "./adminManage.css";

import {
  VenueList, CourtSelector, PricesEditor, SchedulesEditor,
  DOW
} from "../../components/admin";

import {
  useOwnerVenues, useVenueCourts, useCourtPrices, useCourtSchedules
} from "../../hooks/admin/index";
import { useVenuePhotos, useCourtPhotos } from "../../hooks/admin";
import PhotoGalleryEditor from "../../components/admin/PhotoGalleryEditor";

export default function AdminManagePage() {
  const [venueId, setVenueId] = useState<number | null>(null);
  const [courtId, setCourtId] = useState<number | null>(null);

  const venuePhotosApi = useVenuePhotos(venueId);
  const courtPhotosApi = useCourtPhotos(venueId, courtId);
  const venuesApi = useOwnerVenues();
  const courtsApi = useVenueCourts(venueId);
  const pricesApi = useCourtPrices(venueId, courtId);
  const schedulesApi = useCourtSchedules(courtId);

  // cuando cambian sedes/canchas actualizamos selección
  const selectedVenue = useMemo(() => venuesApi.venues.find(v => v.id === venueId) || null, [venuesApi.venues, venueId]);
  const selectedCourt = useMemo(() => courtsApi.courts.find(c => c.id === courtId) || null, [courtsApi.courts, courtId]);

  // seleccionar primera sede/cancha si están vacías
  React.useEffect(() => {
    if (!venueId && venuesApi.venues.length) setVenueId(venuesApi.venues[0].id);
  }, [venuesApi.venues, venueId]);

  React.useEffect(() => {
    if (venueId && courtsApi.courts.length && courtId == null) setCourtId(courtsApi.courts[0].id);
    if (!venueId) { setCourtId(null); }
  }, [venueId, courtsApi.courts, courtId]);

  const loading = venuesApi.loading || courtsApi.loading || pricesApi.loading || schedulesApi.loading;
  const msg = venuesApi.msg || courtsApi.msg || pricesApi.msg || schedulesApi.msg;

  return (
    <div className="admin-page" style={{ gridTemplateColumns: "280px 1fr" }}>
      <div className="panel" style={{ height: "fit-content" }}>
        <div className="panel-header">Sedes</div>
        <VenueList
          venues={venuesApi.venues}
          venueId={venueId}
          onSelect={setVenueId}
          onCreate={async (v) => { const created = await venuesApi.create(v); if (created?.id) setVenueId(created.id); }}
          onUpdate={(v) => { if (venueId) venuesApi.update(venueId, v); }}
          onDelete={() => { if (venueId && confirm("¿Eliminar la sede y todos sus courts?")) venuesApi.remove(venueId).then(() => {
            setVenueId(venuesApi.venues[0]?.id ?? null);
          }); }}
        />
      </div>

      <div className="panel" style={{ display: "grid", gap: 12 }}>
        <div className="panel-header">Detalle</div>

        <section>
          <h3 className="section-title">Cancha</h3>
          <CourtSelector
            courts={courtsApi.courts}
            courtId={courtId}
            onSelect={setCourtId}
            onCreate={(c) => courtsApi.create(c).then(() => {
              const last = courtsApi.courts[courtsApi.courts.length - 1];
              if (last) setCourtId(last.id);
            })}
            onUpdate={(c) => { if (courtId) courtsApi.update(courtId, c); }}
            onDelete={() => { if (courtId && confirm("¿Eliminar la cancha? Esto borrará sus precios y configuraciones.")) {
              courtsApi.remove(courtId).then(() => setCourtId(courtsApi.courts[0]?.id ?? null));
            }}}
          />
        </section>

        <section>
          <h3 className="section-title">Precios</h3>
          {selectedCourt ? (
            <PricesEditor
              prices={pricesApi.prices}
              onCreate={(p) => pricesApi.create(p)}
              onUpdate={(id, p) => pricesApi.update(id, p)}
              onDelete={(id) => pricesApi.remove(id)}
            />
          ) : <p className="muted">Elegí una cancha para gestionar sus precios.</p>}
        </section>

        <section>
          <h3 className="section-title">Horarios</h3>
          {selectedCourt ? (
            <SchedulesEditor
              schedules={schedulesApi.schedules}
              onCreate={(s) => schedulesApi.create(s)}
              onUpdate={(id, s) => schedulesApi.update(id, s)}
              onDelete={(id) => schedulesApi.remove(id)}
            />
          ) : <p className="muted">Elegí una cancha para gestionar sus horarios.</p>}
        </section>

        {msg && <p className="hint">{msg}</p>}
        {loading && <div className="loading">Guardando…</div>}

        <section>
          <h3 className="section-title">Fotos de la sede</h3>
          {venueId ? (
            <PhotoGalleryEditor
              title="Galería del venue"
              photos={venuePhotosApi.photos}
              onCreate={(p) => venuePhotosApi.create(p)}
              onUpdate={(id, p) => venuePhotosApi.update(id, p)}
              onDelete={(id) => venuePhotosApi.remove(id)}
              canSetCover
            />
          ) : <p className="muted">Elegí una sede.</p>}
        </section>

        <section>
          <h3 className="section-title">Fotos de la cancha</h3>
          {selectedCourt ? (
            <PhotoGalleryEditor
              title="Galería de la cancha"
              photos={courtPhotosApi.photos}
              onCreate={(p) => courtPhotosApi.create(p)}
              onUpdate={(id, p) => courtPhotosApi.update(id, p)}
              onDelete={(id) => courtPhotosApi.remove(id)}
              canSetCover
            />
          ) : <p className="muted">Elegí una cancha para gestionar sus fotos.</p>}
        </section>
      </div>
    </div>
  );
}
