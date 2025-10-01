#deps.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .db import get_db
from .config import settings
from .security import decode_token
from app.shared.enums import RoleEnum
from app.domains.users.models import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login"
)

DB = Annotated[Session, Depends(get_db)]
TokenStr = Annotated[str, Depends(oauth2_scheme)]

def get_current_user(token: TokenStr, db: DB) -> User:
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    user = db.get(User, user_id)
    if not user or not getattr(user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user

def require_roles(*roles: RoleEnum):
    def _checker(current: Annotated[User, Depends(get_current_user)]) -> User:
        if current.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permisos insuficientes")
        return current
    return _checker

# atajo común
def require_owner(current: Annotated[User, Depends(get_current_user)]) -> User:
    if current.role not in (RoleEnum.OWNER, RoleEnum.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo OWNER/ADMIN")
    return current
