# app/domains/venues/api/courts_photos_private.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.deps import get_db, require_owner
from app.domains.users.models import User
from app.domains.venues.models import Venue, Court, CourtPhoto
from app.domains.venues.schemas import CourtPhotoCreate, CourtPhotoUpdate, CourtPhotoOut

router = APIRouter(
    prefix="/{venue_id}/courts/{court_id}/photos",
    tags=["courts-photos"],
)

def _get_owned_venue(db: Session, venue_id: int, owner_id: int) -> Venue:
    v = db.get(Venue, venue_id)
    if not v: raise HTTPException(404, "Venue no encontrado")
    if v.owner_user_id != owner_id: raise HTTPException(403, "No sos owner de este venue")
    return v

def _get_owned_court(db: Session, venue_id: int, court_id: int, owner_id: int) -> Court:
    _get_owned_venue(db, venue_id, owner_id)
    c = db.get(Court, court_id)
    if not c or c.venue_id != venue_id:
        raise HTTPException(404, "Court no encontrado")
    return c

@router.get("", response_model=List[CourtPhotoOut])
def list_photos(
    venue_id: int, court_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
):
    c = _get_owned_court(db, venue_id, court_id, owner.id)
    return c.photos  # ordenada por sort_order en la relación

@router.post("", response_model=CourtPhotoOut, status_code=status.HTTP_201_CREATED)
def add_photo(
    venue_id: int, court_id: int,
    payload: CourtPhotoCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
):
    _ = _get_owned_court(db, venue_id, court_id, owner.id)
    if payload.is_cover:
        db.query(CourtPhoto).filter(CourtPhoto.court_id == court_id)\
            .update({CourtPhoto.is_cover: False})
    ph = CourtPhoto(court_id=court_id, **payload.model_dump())
    db.add(ph)
    db.commit()
    db.refresh(ph)
    return ph

@router.patch("/{photo_id}", response_model=CourtPhotoOut)
def update_photo(
    venue_id: int, court_id: int, photo_id: int,
    payload: CourtPhotoUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
):
    _ = _get_owned_court(db, venue_id, court_id, owner.id)
    ph = db.get(CourtPhoto, photo_id)
    if not ph or ph.court_id != court_id:
        raise HTTPException(404, "Foto no encontrada")
    if payload.is_cover is True:
        db.query(CourtPhoto).filter(
            CourtPhoto.court_id == court_id, CourtPhoto.id != photo_id
        ).update({CourtPhoto.is_cover: False})
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(ph, f, v)
    db.commit()
    db.refresh(ph)
    return ph

@router.delete("/{photo_id}", status_code=204)
def delete_photo(
    venue_id: int, court_id: int, photo_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
):
    _ = _get_owned_court(db, venue_id, court_id, owner.id)
    ph = db.get(CourtPhoto, photo_id)
    if not ph or ph.court_id != court_id:
        raise HTTPException(404, "Foto no encontrada")
    db.delete(ph)
    db.commit()
