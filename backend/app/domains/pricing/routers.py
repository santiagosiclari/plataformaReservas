# app/routers/prices.py
from datetime import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.domains.venues.models import Court
from app.domains.pricing.models import Price
from app.domains.pricing.schemas import PriceCreate, PriceUpdate, PriceOut

router = APIRouter(prefix="/venues/{venue_id}/courts/{court_id}/prices", tags=["prices"])

def _get_court(db: Session, court_id: int) -> Court:
    court = db.get(Court, court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Court no encontrada")
    return court

def _time_overlap(a_start: time, a_end: time, b_start: time, b_end: time) -> bool:
    # Overlap si a_start < b_end y a_end > b_start (en tiempo puro)
    return (a_start < b_end) and (a_end > b_start)

def _assert_no_price_overlap(db: Session, court_id: int, weekday: int, start_t: time, end_t: time, exclude_id: Optional[int] = None):
    if start_t >= end_t:
        raise HTTPException(status_code=422, detail="start_time debe ser < end_time")

    q = select(Price).where(
        and_(
            Price.court_id == court_id,
            Price.weekday == weekday,
        )
    )
    rows = db.execute(q).scalars().all()
    for r in rows:
        if exclude_id and r.id == exclude_id:
            continue
        if _time_overlap(start_t, end_t, r.start_time, r.end_time):
            raise HTTPException(
                status_code=409,
                detail=f"Ya existe una regla superpuesta: {r.start_time.strftime('%H:%M')}–{r.end_time.strftime('%H:%M')}"
            )

@router.post("", response_model=PriceOut, status_code=status.HTTP_201_CREATED)
def create_price(venue_id: int, court_id: int, payload: PriceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court(db, court_id)
    if payload.court_id != court_id:
        raise HTTPException(status_code=422, detail="court_id del body no coincide con el path")
    _assert_no_price_overlap(db, court_id, payload.weekday, payload.start_time, payload.end_time)

    pr = Price(**payload.model_dump())
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr

@router.get("", response_model=List[PriceOut])
def list_prices(venue_id: int, court_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court(db, court_id)
    q = select(Price).where(Price.court_id == court_id).order_by(Price.weekday, Price.start_time)
    return db.execute(q).scalars().all()

@router.patch("/{price_id}", response_model=PriceOut)
def update_price(venue_id: int, court_id: int, price_id: int, payload: PriceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court(db, court_id)
    pr = db.get(Price, price_id)
    if not pr or pr.court_id != court_id:
        raise HTTPException(status_code=404, detail="Price no encontrado")

    new_weekday = payload.weekday if payload.weekday is not None else pr.weekday
    new_start = payload.start_time if payload.start_time is not None else pr.start_time
    new_end = payload.end_time if payload.end_time is not None else pr.end_time
    _assert_no_price_overlap(db, court_id, new_weekday, new_start, new_end, exclude_id=pr.id)

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(pr, k, v)

    db.commit()
    db.refresh(pr)
    return pr

@router.delete("/{price_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price(venue_id: int, court_id: int, price_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court(db, court_id)
    pr = db.get(Price, price_id)
    if not pr or pr.court_id != court_id:
        raise HTTPException(status_code=404, detail="Price no encontrado")
    db.delete(pr)
    db.commit()
    return
