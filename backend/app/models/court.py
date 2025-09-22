from typing import List, Optional
from sqlalchemy import String, Boolean, Text, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from .enums import SportEnum

class Court(Base):
    __tablename__ = "courts"
    __table_args__ = (
        UniqueConstraint("venue_id", "number", name="uq_courts_venue_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False, index=True)
    sport: Mapped[SportEnum] = mapped_column(SAEnum(SportEnum), nullable=False)
    surface: Mapped[Optional[str]] = mapped_column(String(60))
    indoor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    number: Mapped[Optional[str]] = mapped_column(String(20))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    venue: Mapped["Venue"] = relationship(back_populates="courts")
    schedules: Mapped[List["CourtSchedule"]] = relationship(back_populates="court", cascade="all, delete-orphan")
    prices: Mapped[List["Price"]] = relationship(back_populates="court", cascade="all, delete-orphan")
    blackouts: Mapped[List["Blackout"]] = relationship(back_populates="court", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="court", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Court id={self.id} venue_id={self.venue_id} sport={self.sport}>"
