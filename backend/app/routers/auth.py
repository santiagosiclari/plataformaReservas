from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from passlib.hash import bcrypt
from app.deps import get_db, get_current_user
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, MeOut, ChangePwdIn

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not bcrypt.verify(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña inválidos")

    claims = {
        "email": user.email,
        "role": user.role.value,  # útil en el front
    }
    token = create_access_token(subject=user.id, claims=claims)
    return Token(access_token=token)

@router.get("/me", response_model=MeOut)
def me(current: User = Depends(get_current_user)):
    return current

@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePwdIn,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if not bcrypt.verify(payload.current_password, me.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual inválida")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Nueva contraseña muy corta")
    me.password_hash = bcrypt.hash(payload.new_password)
    db.add(me)
    db.commit()
    return