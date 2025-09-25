# app/routers/public_courts.py
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.deps import get_db
from app.models.court import Court
from app.models.venue import Venue
from app.models.price import Price

router = APIRouter(prefix="/courts", tags=["courts-public"])

# Haversine en km (aprox). Para producción, preferí PostGIS.
def haversine_km(lat1, lng1, lat2, lng2):
    return 6371 * func.acos(
        func.least(
            1.0,
            func.cos(func.radians(lat1)) * func.cos(func.radians(lat2)) *
            func.cos(func.radians(lng2 - lng1)) +
            func.sin(func.radians(lat1)) * func.sin(func.radians(lat2))
        )
    )

@router.get("/search")
def search_courts(
    q: Optional[str] = Query(None, description="texto: barrio/sede/cancha"),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = Query(None, ge=0),
    sport: Optional[str] = None,
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    stmt = (
        select(
            Court.id.label("court_id"),
            Court.number.label("court_number"),
            Court.sport,
            Court.surface,
            Court.indoor,
            Venue.id.label("venue_id"),
            Venue.name.label("venue_name"),
            Venue.address,
            Venue.latitude,
            Venue.longitude,
        )
        .join(Venue, Venue.id == Court.venue_id)
    )

    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Venue.name.ilike(pattern),
                Venue.address.ilike(pattern),
                Court.number.ilike(pattern),
            )
        )
    if sport:
        stmt = stmt.where(Court.sport == sport)

    distance_col = None
    if lat is not None and lng is not None:
        distance_col = haversine_km(lat, lng, Venue.latitude, Venue.longitude).label("distance_km")
        stmt = stmt.add_columns(distance_col)
        if radius_km:
            stmt = stmt.where(distance_col <= radius_km)
        stmt = stmt.order_by(distance_col.asc())
    else:
        stmt = stmt.order_by(Venue.name.asc())

    stmt = stmt.limit(limit)
    rows = db.execute(stmt).all()

    results: List[Dict[str, Any]] = []
    for r in rows:
        m = r._mapping

        # Hint de precio: primera regla disponible (ajustá a tu criterio)
        price_hint = db.execute(
            select(Price.price_per_slot)
            .where(Price.court_id == m["court_id"])
            .order_by(Price.weekday.asc(), Price.start_time.asc())
            .limit(1)
        ).scalar_one_or_none()

        lat_val = float(m["latitude"]) if m["latitude"] is not None else None
        lng_val = float(m["longitude"]) if m["longitude"] is not None else None

        results.append({
            "id": m["court_id"],
            "venue_id": m["venue_id"],
            "venue_name": m["venue_name"],
            "court_name": f"Cancha {m['court_number']}" if m["court_number"] else "Cancha",
            "sport": str(m["sport"]),
            "surface": m["surface"],
            "indoor": m["indoor"],
            "lat": lat_val,
            "lng": lng_val,
            "address": m["address"],
            "distance_km": float(m["distance_km"]) if distance_col is not None and m.get("distance_km") is not None else None,
            "price_hint": float(price_hint) if price_hint is not None else None,
            "photo_url": None,  # si luego agregás fotos
        })
    return results

@router.get("/{court_id}")
def get_court_public(court_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    row = db.execute(
        select(
            Court.id.label("court_id"),
            Court.number.label("court_number"),
            Court.sport, Court.surface, Court.indoor,
            Venue.id.label("venue_id"),
            Venue.name.label("venue_name"),
            Venue.address,
            Venue.latitude,   # puede ser Decimal
            Venue.longitude,  # puede ser Decimal
        )
        .join(Venue, Venue.id == Court.venue_id)
        .where(Court.id == court_id)
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Court no encontrado")

    lat = float(row["latitude"]) if row["latitude"] is not None else None
    lng = float(row["longitude"]) if row["longitude"] is not None else None

    return {
        "id": row["court_id"],
        "venue_id": row["venue_id"],
        "venue_name": row["venue_name"],
        "court_name": f"Cancha {row['court_number']}" if row["court_number"] else "Cancha",
        "sport": str(row["sport"]),
        "surface": row["surface"],
        "indoor": row["indoor"],
        "address": row["address"],
        # ✅ nombres que espera el front
        "venue_latitude": lat,
        "venue_longitude": lng,
        # (opcional) compatibilidad hacia atrás
        "latitude": lat,
        "longitude": lng,
    }
