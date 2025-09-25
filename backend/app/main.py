# app/main.py
from fastapi import FastAPI
from app.db import Base, engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app import models  # asegura que los modelos estén importados
import os

from .routers import health
from .routers import users
from .routers import courts
from .routers import venues
from .routers import auth
from .routers import schedules
from .routers import bookings
from .routers import availability
from .routers import prices
from app.routers import debug_email
from app.routers import public_courts
from app.routers import public_venues

app = FastAPI(title="Reservas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(users.router)
app.include_router(courts.router)
app.include_router(venues.router)
app.include_router(schedules.router)
app.include_router(bookings.router)
app.include_router(debug_email.router)
app.include_router(availability.router)
app.include_router(prices.router)
app.include_router(public_venues.router)
app.include_router(public_courts.router)


@app.on_event("startup")
def init_db():
    # Log mínimo para verificar
    print(f"[INIT_DB] Creando tablas en: {engine.url}")
    Base.metadata.create_all(bind=engine)

    # Seed opcional (ojo con --reload que puede ejecutar startup 2 veces)
    if os.getenv("SEED_DEMO", "0") == "1":
        try:
            from app.seeds import seed_minimo
            with SessionLocal() as db:
                seed_minimo(db)
            print("[INIT_DB] Seed ejecutado")
        except Exception as e:
            print(f"[INIT_DB] Seed falló: {e}")

@app.get("/")
def root():
    return {"ok": True, "service": "reservas-api"}
