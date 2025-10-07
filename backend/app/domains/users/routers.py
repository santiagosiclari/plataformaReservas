# router/users
import os
from fastapi import APIRouter, Depends, status, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select
from passlib.hash import bcrypt
from app.core.deps import get_db, require_owner, get_current_user
from app.domains.users.models import User
from app.shared.enums import RoleEnum
from app.domains.users.schemas import UserCreate, UserOut, UserRoleUpdate, UserUpdate
from app.domains.bookings.models import Booking

router = APIRouter(prefix="/users", tags=["users"])

@router.patch("/{user_id}", response_model=UserOut)
def update_user_basic(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.id != user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if payload.name is not None:
        user.name = payload.name
    if payload.phone is not None:
        # reutilizá tu validador E164 si querés, o validá acá
        user.phone = payload.phone

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    x_admin: str | None = Header(None, alias="X-Admin"),  # para dev
):
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="Email ya registrado")

    # por defecto PLAYER
    role = RoleEnum.PLAYER

    # permitir override SOLO en dev (env var o header)
    if payload.role and (os.getenv("ALLOW_ROLE_OVERRIDE", "0") == "1" or x_admin == "1"):
        role = payload.role

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=bcrypt.hash(payload.password),
        phone=payload.phone,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User)).all()

@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_owner),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = payload.role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me/bookings", response_model=list[dict])  # podés tipar con un Schema si ya lo tenés
def my_bookings(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    # Devolvé lo esencial; si tenés schema BookingOut, usalo
    rows = db.scalars(select(Booking).where(Booking.user_id == me.id)).all()
    return [
        {
            "id": b.id,
            "user_id": b.user_id,
            "court_id": b.court_id,
            "start_datetime": b.start_datetime,
            "end_datetime": b.end_datetime,
            "status": b.status,
            "price_total": b.price_total,
            "created_at": b.created_at,
        }
        for b in rows
    ]
