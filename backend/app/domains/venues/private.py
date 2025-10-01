from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.core.deps import get_db, get_current_user, require_owner, require_roles
from app.shared.integrations.geocoding import geocode_nominatim

from app.domains.venues.schemas import CourtCreate, CourtUpdate, CourtOut, VenueCreate, VenueUpdate, VenueOut
from app.domains.venues.models import Venue, Court
from app.domains.users.models import User

router = APIRouter(prefix="/{venue_id}/courts", tags=["courts"])

def _get_owned_venue(db: Session, venue_id: int, owner_id: int) -> Venue:
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")
    if venue.owner_user_id != owner_id:
        raise HTTPException(status_code=403, detail="No sos owner de este venue")
    return venue

@router.post("", response_model=CourtOut, status_code=status.HTTP_201_CREATED)
def create_court(
    venue_id: int,
    payload: CourtCreate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")

    if venue.owner_user_id != current_owner.id:
        raise HTTPException(status_code=403, detail="No sos owner de este venue")

    if payload.number:
        exists = db.scalar(
            select(func.count()).select_from(Court)
            .where(Court.venue_id == venue_id, Court.number == payload.number)
        )
        if exists:
            raise HTTPException(status_code=409, detail="Ya existe una cancha con ese número en este venue")

    court = Court(venue_id=venue_id, **payload.model_dump())
    db.add(court)
    db.commit()
    db.refresh(court)
    return court

@router.get("", response_model=list[CourtOut])
def list_courts(
    venue_id: int,
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")
    if venue.owner_user_id != current_owner.id:
        raise HTTPException(status_code=403, detail="No sos owner de este venue")

    rows = db.scalars(select(Court).where(Court.venue_id == venue_id)).all()
    return rows

@router.patch("/{court_id}", response_model=CourtOut)
def update_court(venue_id: int, court_id: int, payload: CourtUpdate, db: Session = Depends(get_db), owner: User = Depends(require_owner)):
    _get_owned_venue(db, venue_id, owner.id)
    court = db.get(Court, court_id)
    if not court or court.venue_id != venue_id:
        raise HTTPException(status_code=404, detail="Court no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(court, k, v)
    try:
        db.add(court)
        db.commit()
        db.refresh(court)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Número de cancha duplicado en el mismo venue")
    return court

@router.delete("/{court_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_court(venue_id: int, court_id: int, db: Session = Depends(get_db), owner: User = Depends(require_owner)):
    _get_owned_venue(db, venue_id, owner.id)
    court = db.get(Court, court_id)
    if not court or court.venue_id != venue_id:
        raise HTTPException(status_code=404, detail="Court no encontrado")
    db.delete(court)
    db.commit()
    return None