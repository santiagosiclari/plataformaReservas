# app/core/db.py
from __future__ import annotations
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


class Base(DeclarativeBase):
    pass

def _normalize_db_url(raw: str) -> str:

    if not raw:
        return raw
    if raw.startswith("postgresql://"):
        raw = raw.replace("postgresql://", "postgresql+psycopg://", 1)

    if raw.startswith("postgresql+psycopg://"):
        u = urlparse(raw)
        qs = dict(parse_qsl(u.query))
        qs.setdefault("sslmode", "require")
        raw = urlunparse(u._replace(query=urlencode(qs)))
    return raw


DATABASE_URL = _normalize_db_url(settings.DATABASE_URL or "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definido")

is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=not is_sqlite,
    pool_recycle=0 if is_sqlite else 1800,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_size=None if is_sqlite else 5,
    max_overflow=None if is_sqlite else 10,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
