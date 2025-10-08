from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.core.deps import get_db, get_current_user, require_owner, require_roles
from app.shared.integrations.geocoding import geocode_nominatim

# REVISAR DESPUES
from .courts_photos_private import router as court_photos_private_router
from app.domains.venues.schemas import CourtCreate, CourtUpdate, CourtOut, VenueCreate, VenueUpdate, VenueOut, VenuePhotoCreate, VenuePhotoOut, VenuePhotoUpdate
from app.domains.venues.models import Venue, VenuePhoto
from app.domains.users.models import User
from app.shared.integrations.google_address import validate_address, extract_normalized_fields, AddressValidationError

from . import private as _private   # tu archivo con CRUD owner (/venues, /{venue_id}, /{venue_id}/courts)
from . import public as _public
from .venues_photos_ import router as venues_photos

router = APIRouter(prefix="/venues", tags=["venues"])

@router.post("", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
async def create_venue(
    payload: VenueCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # 1) (Si en el futuro viene google_place_id, acá podés branch-ear a Places Details)
    if getattr(payload, "google_place_id", None):
        raise HTTPException(status_code=501, detail="Alta por google_place_id aún no implementada.")

    # 2) Validar dirección con Google
    try:
        raw = await validate_address(
            region_code=payload.region_code,
            address_lines=payload.address_lines,
            locality=payload.locality,
            administrative_area=payload.administrative_area,
            postal_code=payload.postal_code,
        )
    except AddressValidationError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    normalized, ok = extract_normalized_fields(raw)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La dirección no pudo validarse completamente. Verificá los datos o elegí una sugerencia.",
        )

    # ⬇️ Forzar ISO-2 para cumplir con VARCHAR(2)
    normalized["country_code"] = (payload.region_code or "AR")[:2].upper()

    # 4) Persistir venue con campos normalizados
    venue = Venue(
        name=payload.name,
        address=normalized.get("address") or "",
        city=normalized.get("city") or "",
        state=normalized.get("state"),
        postal_code=normalized.get("postal_code"),
        country_code=normalized.get("country_code"),
        latitude=normalized.get("latitude"),
        longitude=normalized.get("longitude"),
        google_formatted_address=normalized.get("google_formatted_address"),
        address_components=normalized.get("address_components"),
        validated_address=ok,  # 👈 usar el flag real
        owner_user_id=user.id,
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
router.include_router(venues_photos)