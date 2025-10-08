from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Numeric, Integer, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

from sqlalchemy import String, Boolean, Text, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.shared.enums import SportEnum, SurfaceEnum

class Venue(Base):
    __tablename__ = "venues"

    __table_args__ = (
        Index("idx_city_state", "city", "state"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    # --- Dirección normalizada ---
    address: Mapped[str] = mapped_column(String(255), nullable=False)  # Calle + número
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(120))
    postal_code: Mapped[Optional[str]] = mapped_column(String(20))
    country_code: Mapped[Optional[str]] = mapped_column(String(5))  # Ej: "AR"

    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6))

    # --- Integración con Google Maps ---
    google_place_id: Mapped[Optional[str]] = mapped_column(String(120), unique=True)
    google_formatted_address: Mapped[Optional[str]] = mapped_column(String(255))
    address_components: Mapped[Optional[dict]] = mapped_column(JSON)  # para guardar los address_components completos
    validated_address: Mapped[bool] = mapped_column(Boolean, default=False)

    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="owned_venues",
        foreign_keys=[owner_user_id],
    )

    courts: Mapped[List["Court"]] = relationship(back_populates="venue", cascade="all, delete-orphan")
    photos: Mapped[List["VenuePhoto"]] = relationship(
        "VenuePhoto", back_populates="venue", cascade="all, delete-orphan", order_by="VenuePhoto.sort_order"
    )

    def __repr__(self) -> str:
        return f"<Venue id={self.id} name={self.name!r}>"

class Court(Base):
    __tablename__ = "courts"
    __table_args__ = (
        UniqueConstraint("venue_id", "number", name="uq_courts_venue_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False, index=True)
    sport: Mapped[SportEnum] = mapped_column(SAEnum(SportEnum), nullable=False)
    surface: Mapped[SurfaceEnum] = mapped_column(SAEnum(SurfaceEnum))
    indoor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    number: Mapped[Optional[str]] = mapped_column(String(20))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    venue: Mapped["Venue"] = relationship(back_populates="courts")
    schedules: Mapped[List["CourtSchedule"]] = relationship(back_populates="court", cascade="all, delete-orphan")
    prices: Mapped[List["Price"]] = relationship(back_populates="court", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="court", cascade="all, delete-orphan")
    photos: Mapped[List["CourtPhoto"]] = relationship(
        "CourtPhoto", back_populates="court", cascade="all, delete-orphan", order_by="CourtPhoto.sort_order"
    )

    def __repr__(self) -> str:
        return f"<Court id={self.id} venue_id={self.venue_id} sport={self.sport}>"

class VenuePhoto(Base):
    __tablename__ = "venue_photos"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), index=True, nullable=False)
    url: Mapped[str] = mapped_column(String(600), nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alt_text: Mapped[Optional[str]] = mapped_column(String(255))

    venue: Mapped["Venue"] = relationship("Venue", back_populates="photos")

class CourtPhoto(Base):
    __tablename__ = "court_photos"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id", ondelete="CASCADE"), index=True, nullable=False)
    url: Mapped[str] = mapped_column(String(600), nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    alt_text: Mapped[Optional[str]] = mapped_column(String(255))

    court: Mapped["Court"] = relationship("Court", back_populates="photos")