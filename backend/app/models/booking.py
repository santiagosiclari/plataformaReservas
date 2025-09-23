from datetime import datetime
from sqlalchemy import DateTime, Numeric, ForeignKey, Index, Enum as SAEnum, func
from decimal import Decimal
from typing import ClassVar, Optional, Set, Tuple, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from .enums import BookingStatusEnum
from .booking_state_machine import BookingStateMachine, DefaultStateMachine

class Booking(Base):
    __tablename__ = "bookings"

    _state_machine: ClassVar[BookingStateMachine] = DefaultStateMachine()

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id"), nullable=False, index=True)
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[BookingStatusEnum] = mapped_column(
        SAEnum(BookingStatusEnum), default=BookingStatusEnum.PENDING, nullable=False
    )
    price_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship(back_populates="bookings")
    court: Mapped["Court"] = relationship(back_populates="bookings")

    __table_args__ = (
        Index("ix_bookings_court_start", "court_id", "start_datetime"),
    )

    def __repr__(self) -> str:
        return f"<Booking id={self.id} court_id={self.court_id} {self.start_datetime} status={self.status}>"

    # ---------------------------
    # Invariantes / utilitarios
    # ---------------------------
    def validate_invariants(self) -> None:
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be greater than start_datetime")
        if self.price_total is None:
            raise ValueError("price_total is required")
        if Decimal(self.price_total) < Decimal("0.00"):
            raise ValueError("price_total cannot be negative")
        if not isinstance(self.status, BookingStatusEnum):
            raise ValueError("status must be a BookingStatusEnum value")

    @property
    def duration_minutes(self) -> int:
        return int((self.end_datetime - self.start_datetime).total_seconds() // 60)

    @classmethod
    def blocking_statuses(cls) -> Set[BookingStatusEnum]:
        return {BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED}

    @property
    def is_active(self) -> bool:
        return self.status in self.blocking_statuses()

    # ---------------------------
    # Delegación a la StateMachine
    # ---------------------------
    def can_confirm(self, now: datetime) -> Tuple[bool, Optional[str]]:
        return self._sm().can_confirm(self, now)

    def confirm(self, by_user_id: int, at: datetime) -> None:
        self._sm().confirm(self, by_user_id, at)

    def can_cancel(self, now: datetime, late_window_hours: int) -> Tuple[bool, bool, Optional[str]]:
        return self._sm().can_cancel(self, now, late_window_hours)

    def cancel(
        self,
        by_user_id: int,
        now: datetime,
        late_window_hours: int,
        reason: Optional[str] = None,
    ) -> None:
        self._sm().cancel(self, by_user_id, now, late_window_hours, reason)

    # ---------------------------
    # Serialización / integración
    # ---------------------------
    def to_public_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "court_id": self.court_id,
            "start_datetime": self.start_datetime.isoformat(),
            "end_datetime": self.end_datetime.isoformat(),
            "status": self.status.value if isinstance(self.status, BookingStatusEnum) else str(self.status),
            "price_total": str(self.price_total),
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else None,
        }

    def snapshot_key(self) -> str:
        return f"{self.user_id}:{self.court_id}:{self.start_datetime.isoformat()}"

    # ---------------------------
    # Interno: obtener SM actual
    # ---------------------------
    @classmethod
    def _sm(cls) -> BookingStateMachine:
        return cls._state_machine


