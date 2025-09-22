# router/users
import os
from fastapi import APIRouter, Depends, status, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select
from passlib.hash import bcrypt
from app.deps import get_db, require_owner
from app.models.user import User
from app.models.enums import RoleEnum
from app.schemas.user import UserCreate, UserOut, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])

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