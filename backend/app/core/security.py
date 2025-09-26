# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
from uuid import uuid4

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

# ----- Password hashing -----
pwd_context = CryptContext(
    schemes=["bcrypt"],  # considera "argon2" si podés instalarlo
    deprecated="auto",
)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ----- JWT helpers -----
def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _base_claims(subject: str | int) -> Dict[str, Any]:
    now = _now_utc()
    claims: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "jti": uuid4().hex,
    }
    return claims

def _encode(claims: Dict[str, Any], minutes: int) -> str:
    exp = _now_utc() + timedelta(minutes=minutes)
    claims = {**claims, "exp": int(exp.timestamp())}
    return jwt.encode(claims, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_access_token(
    subject: str | int,
    extra: Optional[Dict[str, Any]] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    claims = _base_claims(subject)
    if extra:
        claims.update(extra)
    minutes = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    return _encode(claims, minutes)

def create_refresh_token(
    subject: str | int,
    extra: Optional[Dict[str, Any]] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    claims = _base_claims(subject)
    if extra:
        claims.update(extra)
    minutes = expires_minutes or settings.REFRESH_TOKEN_EXPIRE_MINUTES
    claims["typ"] = "refresh"
    return _encode(claims, minutes)

def decode_token(token: str) -> dict:
    """
    Lanza ValueError si el token no es válido. Aplica leeway, y valida iss/aud si están configurados.
    """
    try:
        options = {
            "verify_signature": True,
            "verify_exp": True,
            "verify_nbf": True,
            "verify_iat": True,
            "verify_iss": bool(settings.JWT_ISSUER),
            "verify_aud": bool(settings.JWT_AUDIENCE),
        }
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE if settings.JWT_AUDIENCE else None,
            issuer=settings.JWT_ISSUER if settings.JWT_ISSUER else None,
            options=options,
            leeway=settings.JWT_LEEWAY_SECONDS,
        )
    except JWTError as e:
        # Acá devolvemos un ValueError para que deps.py traduzca a 401
        raise ValueError("Invalid token") from e
