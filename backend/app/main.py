# app/main.py
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.core.db import Base, engine, SessionLocal

from app.domains.auth import routers as auth
from app.domains.users import routers as users
from app.domains.venues import routers as venues
from app.domains.scheduling import routers as availability
from app.domains.schedules import routers as schedules
from app.domains.bookings import routers as bookings
from app.domains.pricing import routers as prices
from app.domains.venues.public import router as venues_public

load_dotenv()

app = FastAPI(title="Reservas API")

# --- Middlewares ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                # desarrollo
        "https://plataformareserva.netlify.app" # producción frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(venues.router, prefix="/api/v1", tags=["venues"])
app.include_router(schedules.router, prefix="/api/v1", tags=["schedules"])
app.include_router(availability.router, prefix="/api/v1", tags=["availability"])
app.include_router(bookings.router, prefix="/api/v1", tags=["bookings"])
app.include_router(prices.router, prefix="/api/v1", tags=["prices"])
app.include_router(venues_public, prefix="/api/v1", tags=["venues-public"])


# --- Startup: init DB ---
@app.on_event("startup")
def init_db():
    print(f"[INIT_DB] Creando tablas en: {engine.url}")
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"ok": True, "service": "reservas-api"}
