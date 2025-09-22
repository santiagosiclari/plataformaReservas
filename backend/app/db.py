# app/db.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Cargar .env si está disponible
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definido. Configurá la variable o el .env.")

class Base(DeclarativeBase):
    pass

# Para MySQL: pre_ping y recycle para evitar 'server has gone away'
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()