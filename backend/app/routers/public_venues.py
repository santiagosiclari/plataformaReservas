# app/routers/public_venues.py
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.deps import get_db
from app.models.venue import Venue
from app.models.court import Court  # si querés filtrar por sport
from pydantic import BaseModel

router = APIRouter(prefix="/public/venues", tags=["public-venues"])

@router.get("/geo")
def list_public_venues_geojson(
    db: Session = Depends(get_db),
    city: Optional[str] = Query(None, description="Filtra por ciudad"),
):
    stmt = select(Venue)
    if city:
        stmt = stmt.where(Venue.city.ilike(f"%{city}%"))
    venues = db.scalars(stmt).all()

    features = []
    for v in venues:
        if v.latitude is None or v.longitude is None:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point",
                         "coordinates": [float(v.longitude), float(v.latitude)]},  # [lng, lat]
            "properties": {
                "id": v.id,
                "name": v.name,
                "address": v.address,
                "city": v.city,
            },
        })

    return JSONResponse({"type": "FeatureCollection", "features": features})


# --------- (opcional) listado público paginado con filtros ----------
class VenuePublicOut(BaseModel):
    id: int
    name: str
    address: str
    city: str
    latitude: float | None = None
    longitude: float | None = None

    class Config:
        from_attributes = True

class Paginated(BaseModel):
    items: List[VenuePublicOut]
    total: int
    page: int
    page_size: int

@router.get("", response_model=Paginated)
def list_public_venues(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="Busca por nombre/dirección/ciudad"),
    city: Optional[str] = None,
    sport: Optional[str] = Query(None, description="Filtra venues que tengan canchas de este deporte"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=200),
):
    stmt = select(Venue)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Venue.name.ilike(like)) |
            (Venue.address.ilike(like)) |
            (Venue.city.ilike(like))
        )
    if city:
        stmt = stmt.where(Venue.city.ilike(f"%{city}%"))

    # Si se filtra por deporte, uní con Court
    if sport:
        stmt = (
            select(Venue)
            .join(Court, Court.venue_id == Venue.id)
            .where(Court.sport == sport)
            .distinct()
        )
        # re-aplico filtros de texto/ciudad si vinieron:
        if q:
            like = f"%{q}%"
            stmt = stmt.where(
                (Venue.name.ilike(like)) |
                (Venue.address.ilike(like)) |
                (Venue.city.ilike(like))
            )
        if city:
            stmt = stmt.where(Venue.city.ilike(f"%{city}%"))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    return Paginated(
        items=[VenuePublicOut.model_validate(v) for v in items],
        total=total,
        page=page,
        page_size=page_size,
    )
