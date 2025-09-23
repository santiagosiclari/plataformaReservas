from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user, require_roles  # ajusta si usas require_roles
from app.models.court import Court
from app.models.schedule import CourtSchedule
from app.schemas.schedule import CourtScheduleCreate, CourtScheduleUpdate, CourtScheduleOut
from app.models.user import User

router = APIRouter(prefix="/courts/{court_id}/schedules", tags=["schedules"])

# -------------------------
# Helpers
# -------------------------

def _get_court(db: Session, court_id: int) -> Court:
    court = db.get(Court, court_id)
    if not court:
        raise HTTPException(status_code=404, detail="Court no encontrada")
    return court

def _assert_owner_or_admin(db: Session, court: Court, user: User):
    # Se asume Court.venue.owner_user_id referencia al dueño
    venue = court.venue
    if not venue:
        raise HTTPException(status_code=400, detail="Court sin venue asociada")
    if user.role != "ADMIN" and venue.owner_user_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado. Solo OWNER de la venue o ADMIN.")

# -------------------------
# Endpoints
# -------------------------

@router.get("", response_model=List[CourtScheduleOut])
def list_schedules(court_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_court(db, court_id)  # valida existencia
    q = select(CourtSchedule).where(CourtSchedule.court_id == court_id).order_by(CourtSchedule.weekday.asc())
    return db.execute(q).scalars().all()

@router.post("", response_model=CourtScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    court_id: int,
    payload: CourtScheduleCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    court = _get_court(db, court_id)
    _assert_owner_or_admin(db, court, user)

    sched = CourtSchedule(
        court_id=court_id,
        weekday=payload.weekday,
        open_time=payload.open_time,
        close_time=payload.close_time,
        slot_minutes=payload.slot_minutes or 60,
    )
    db.add(sched)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # índice único por (court_id, weekday)
        raise HTTPException(status_code=409, detail="Ya existe un horario para ese día en esta cancha.")
    db.refresh(sched)
    return sched

@router.get("/{schedule_id}", response_model=CourtScheduleOut)
def get_schedule(court_id: int, schedule_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    sched = db.get(CourtSchedule, schedule_id)
    if not sched or sched.court_id != court_id:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")
    return sched

@router.patch("/{schedule_id}", response_model=CourtScheduleOut)
def update_schedule(
    court_id: int,
    schedule_id: int,
    payload: CourtScheduleUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    court = _get_court(db, court_id)
    _assert_owner_or_admin(db, court, user)

    sched = db.get(CourtSchedule, schedule_id)
    if not sched or sched.court_id != court_id:
        raise HTTPException(status_code=404, detail="Schedule no encontrado")

    if payload.weekday is not None:
        sched.weekday = payload.weekday
    if payload.open_time is not None:
        sched.open_time = payload.open_time
    if payload.close_time is not None:
        sched.close_time = payload.close_time
    if payload.slot_minutes is not None:
        sched.slot_minutes = payload.slot_minutes

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe un horario para ese día en esta cancha.")
    db.refresh(sched)
    return sched

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    court_id: int,
    schedule_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    court = _get_court(db, court_id)
    _assert_owner_or_admin(db, court, user)

    sched = db.get(CourtSchedule, schedule_id)
    if not sched or sched.court_id != court_id:
        # idempotente
        return
    db.delete(sched)
    db.commit()
    return
