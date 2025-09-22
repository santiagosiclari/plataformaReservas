#deps.py
from typing import Generator
from app.db import SessionLocal, get_db
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.enums import RoleEnum

def get_current_user(
    x_user_id: int | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Falta X-User-Id en el header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

def require_owner(user: User = Depends(get_current_user)) -> User:
    if user.role != RoleEnum.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo owners pueden realizar esta acción")
    return user


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_admin(x_admin: str | None = Header(None, alias="X-Admin")):
    if x_admin != "1":
        raise HTTPException(status_code=403, detail="Solo admin")