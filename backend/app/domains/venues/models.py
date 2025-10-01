from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

from sqlalchemy import String, Boolean, Text, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.shared.enums import SportEnum, SurfaceEnum

class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)

    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6))

    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="owned_venues",
        foreign_keys=[owner_user_id],
    )

    courts: Mapped[List["Court"]] = relationship(back_populates="venue", cascade="all, delete-orphan")

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

    def __repr__(self) -> str:
        return f"<Court id={self.id} venue_id={self.venue_id} sport={self.sport}>"
