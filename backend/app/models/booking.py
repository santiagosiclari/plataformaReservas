from datetime import datetime
from sqlalchemy import DateTime, Numeric, ForeignKey, Index, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from .enums import BookingStatusEnum

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id"), nullable=False, index=True)
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[BookingStatusEnum] = mapped_column(
        SAEnum(BookingStatusEnum), default=BookingStatusEnum.CONFIRMED, nullable=False
    )
    price_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship(back_populates="bookings")
    court: Mapped["Court"] = relationship(back_populates="bookings")

    __table_args__ = (
        Index("ix_bookings_court_start", "court_id", "start_datetime"),
    )

    def __repr__(self) -> str:
        return f"<Booking id={self.id} court_id={self.court_id} {self.start_datetime} status={self.status}>"
