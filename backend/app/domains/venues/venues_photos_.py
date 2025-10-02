# app/domains/photos/venues_photos_.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, update, delete
from app.core.deps import get_db, get_current_user, require_owner
from app.domains.venues.models import Venue, VenuePhoto, Court, CourtPhoto
from .schemas import VenuePhotoBase, VenuePhotoOut, CourtPhotoBase, CourtPhotoOut

router = APIRouter(tags=["photos"])

# helpers
def _get_owned_venue(db: Session, venue_id: int, owner_id: int) -> Venue:
    ven = db.get(Venue, venue_id)
    if not ven: raise HTTPException(404, "Venue no encontrado")
    if ven.owner_user_id != owner_id: raise HTTPException(403, "No sos owner")
    return ven

def _get_court_in_owned_venue(db: Session, venue_id: int, court_id: int, owner_id: int) -> Court:
    _get_owned_venue(db, venue_id, owner_id)
    crt = db.get(Court, court_id)
    if not crt or crt.venue_id != venue_id:
        raise HTTPException(404, "Court no encontrado")
    return crt

def _ensure_unique_cover_for_venue(db: Session, venue_id: int, photo_id: int):
    db.execute(
        update(VenuePhoto)
        .where(VenuePhoto.venue_id == venue_id, VenuePhoto.id != photo_id)
        .values(is_cover=False)
    )

def _ensure_unique_cover_for_court(db: Session, court_id: int, photo_id: int):
    db.execute(
        update(CourtPhoto)
        .where(CourtPhoto.court_id == court_id, CourtPhoto.id != photo_id)
        .values(is_cover=False)
    )

def _normalize_sort_orders_for_venue(db: Session, venue_id: int):
    photos = db.scalars(
        select(VenuePhoto).where(VenuePhoto.venue_id == venue_id).order_by(VenuePhoto.sort_order, VenuePhoto.id)
    ).all()
    for i, p in enumerate(photos):
        p.sort_order = i

def _normalize_sort_orders_for_court(db: Session, court_id: int):
    photos = db.scalars(
        select(CourtPhoto).where(CourtPhoto.court_id == court_id).order_by(CourtPhoto.sort_order, CourtPhoto.id)
    ).all()
    for i, p in enumerate(photos):
        p.sort_order = i

# -------- VENUE PHOTOS --------
@router.get("/{venue_id}/photos", response_model=list[VenuePhotoOut])
def list_venue_photos(venue_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ven = db.get(Venue, venue_id)
    if not ven: raise HTTPException(404, "Venue no encontrado")
    return ven.photos  # ya ordenadas por relationship(order_by)

@router.post("/{venue_id}/photos", response_model=VenuePhotoOut, status_code=status.HTTP_201_CREATED)
def create_venue_photo(venue_id: int, body: VenuePhotoBase, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_owned_venue(db, venue_id, user.id)
    p = VenuePhoto(venue_id=venue_id, **body.model_dump())
    db.add(p); db.flush()
    if p.is_cover:
        _ensure_unique_cover_for_venue(db, venue_id, p.id)
    _normalize_sort_orders_for_venue(db, venue_id)
    db.commit(); db.refresh(p)
    return p

@router.patch("/{venue_id}/photos/{photo_id}", response_model=VenuePhotoOut)
def update_venue_photo(venue_id: int, photo_id: int, body: VenuePhotoBase, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_owned_venue(db, venue_id, user.id)
    p = db.get(VenuePhoto, photo_id)
    if not p or p.venue_id != venue_id: raise HTTPException(404, "Foto no encontrada")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    db.flush()
    if p.is_cover:
        _ensure_unique_cover_for_venue(db, venue_id, p.id)
    _normalize_sort_orders_for_venue(db, venue_id)
    db.commit(); db.refresh(p)
    return p

@router.delete("/{venue_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue_photo(venue_id: int, photo_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_owned_venue(db, venue_id, user.id)
    p = db.get(VenuePhoto, photo_id)
    if not p or p.venue_id != venue_id: raise HTTPException(404, "Foto no encontrada")
    db.delete(p); db.flush()
    _normalize_sort_orders_for_venue(db, venue_id)
    db.commit()

# -------- COURT PHOTOS --------
@router.get("/{venue_id}/courts/{court_id}/photos", response_model=list[CourtPhotoOut])
def list_court_photos(venue_id: int, court_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    crt = _get_court_in_owned_venue(db, venue_id, court_id, user.id)
    return crt.photos

@router.post("/{venue_id}/courts/{court_id}/photos", response_model=CourtPhotoOut, status_code=status.HTTP_201_CREATED)
def create_court_photo(venue_id: int, court_id: int, body: CourtPhotoBase, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court_in_owned_venue(db, venue_id, court_id, user.id)
    p = CourtPhoto(court_id=court_id, **body.model_dump())
    db.add(p); db.flush()
    if p.is_cover:
        _ensure_unique_cover_for_court(db, court_id, p.id)
    _normalize_sort_orders_for_court(db, court_id)
    db.commit(); db.refresh(p)
    return p

@router.patch("/{venue_id}/courts/{court_id}/photos/{photo_id}", response_model=CourtPhotoOut)
def update_court_photo(venue_id: int, court_id: int, photo_id: int, body: CourtPhotoBase, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court_in_owned_venue(db, venue_id, court_id, user.id)
    p = db.get(CourtPhoto, photo_id)
    if not p or p.court_id != court_id: raise HTTPException(404, "Foto no encontrada")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    db.flush()
    if p.is_cover:
        _ensure_unique_cover_for_court(db, court_id, p.id)
    _normalize_sort_orders_for_court(db, court_id)
    db.commit(); db.refresh(p)
    return p

@router.delete("/{venue_id}/courts/{court_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_court_photo(venue_id: int, court_id: int, photo_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court_in_owned_venue(db, venue_id, court_id, user.id)
    p = db.get(CourtPhoto, photo_id)
    if not p or p.court_id != court_id: raise HTTPException(404, "Foto no encontrada")
    db.delete(p); db.flush()
    _normalize_sort_orders_for_court(db, court_id)
    db.commit()
