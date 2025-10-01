from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.core.deps import get_db, get_current_user, require_owner, require_roles
from app.shared.integrations.geocoding import geocode_nominatim

# REVISAR DESPUES
from .courts_photos_private import router as court_photos_private_router  # 👈 nuevo
from app.domains.venues.schemas import CourtCreate, CourtUpdate, CourtOut, VenueCreate, VenueUpdate, VenueOut, VenuePhotoCreate, VenuePhotoOut, VenuePhotoUpdate
from app.domains.venues.models import Venue, VenuePhoto
from app.domains.users.models import User

from . import private as _private   # tu archivo con CRUD owner (/venues, /{venue_id}, /{venue_id}/courts)
from . import public as _public

router = APIRouter(prefix="/venues", tags=["venues"])

@router.post("", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
async def create_venue(payload: VenueCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # usar coords si vinieron; si no, geocodificar
    lat, lng = payload.latitude, payload.longitude
    if lat is None and lng is None:
        coords = await geocode_nominatim(payload.address, payload.city)
        if not coords:
            raise HTTPException(
                status_code=422,
                detail="No se pudo geocodificar la dirección. Verifica address/city o envía latitude/longitude."
            )
        lat, lng = coords

    venue = Venue(
        name=payload.name,
        address=payload.address,
        city=payload.city,
        latitude=lat,
        longitude=lng,
        owner_user_id=user.id,  # ajusta según tu auth
    )
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue

@router.get("", response_model=List[VenueOut])
def list_my_venues(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    stmt = (
        select(Venue)
        .where(Venue.owner_user_id == current_owner.id)
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(stmt).all()

@router.get("/{venue_id}", response_model=VenueOut)
def get_venue(
    venue_id: int,
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")
    if venue.owner_user_id != current_owner.id:
        raise HTTPException(status_code=403, detail="No sos owner de este venue")
    return venue

@router.patch("/{venue_id}", response_model=VenueOut)
async def update_venue(venue_id: int, payload: VenueUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")
    if venue.owner_user_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="No autorizado")

    # aplicar cambios simples
    if payload.name is not None:
        venue.name = payload.name
    if payload.address is not None:
        venue.address = payload.address
    if payload.city is not None:
        venue.city = payload.city

    # coords explícitas tienen prioridad
    if payload.latitude is not None and payload.longitude is not None:
        venue.latitude = payload.latitude
        venue.longitude = payload.longitude
    else:
        # si cambiaron address/city y NO enviaron coords nuevas, re-geocodificar
        if payload.address is not None or payload.city is not None:
            coords = await geocode_nominatim(venue.address, venue.city)
            if coords:
                venue.latitude, venue.longitude = coords
            else:
                # no hard-fail en update: mantenemos coords viejas si había,
                # pero avisar con 422 si prefieres exigir éxito.
                pass

    db.commit()
    db.refresh(venue)
    return venue

@router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(
    venue_id: int,
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")
    if venue.owner_user_id != current_owner.id:
        raise HTTPException(status_code=403, detail="No sos owner de este venue")

    db.delete(venue)
    db.commit()
    return None

router.include_router(_private.router)         # /venues/* (owner)
router.include_router(_public.router)          # /venues/public/* y /venues/courts/search etc.
router.include_router(court_photos_private_router)     # /venues/{venue_id}/courts/{court_id}/photos (owner)
