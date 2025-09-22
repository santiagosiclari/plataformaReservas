from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.deps import get_db, require_owner
from app.models.venue import Venue
from app.models.user import User
from app.schemas.venue import VenueCreate, VenueUpdate, VenueOut

router = APIRouter(prefix="/venues", tags=["venues"])

@router.post("", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
def create_venue(
    payload: VenueCreate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    venue = Venue(owner_user_id=current_owner.id, **payload.model_dump())
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
def update_venue(
    venue_id: int,
    payload: VenueUpdate,
    db: Session = Depends(get_db),
    current_owner: User = Depends(require_owner),
):
    venue = db.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue no encontrado")
    if venue.owner_user_id != current_owner.id:
        raise HTTPException(status_code=403, detail="No sos owner de este venue")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(venue, k, v)

    db.add(venue)
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
