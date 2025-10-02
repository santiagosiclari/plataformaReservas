from __future__ import annotations
from datetime import datetime, timedelta

from app.shared.enums import BookingStatusEnum
from sqlalchemy import DateTime, Numeric, ForeignKey, Index, Enum as SAEnum, func
from decimal import Decimal
from typing import ClassVar, Optional, Set, Tuple, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class BookingStateMachine:
    """
    Interfaz mínima para una máquina de estados enchufable.
    Podés reemplazarla en runtime con Booking.set_state_machine(...)
    """

    def can_confirm(self, booking: "Booking", now: datetime) -> Tuple[bool, Optional[str]]:
        raise NotImplementedError

    def confirm(self, booking: "Booking", by_user_id: int, at: datetime) -> None:
        raise NotImplementedError

    def can_cancel(
        self, booking: "Booking", now: datetime, late_window_hours: int
    ) -> Tuple[bool, bool, Optional[str]]:
        raise NotImplementedError

    def cancel(
        self,
        booking: "Booking",
        by_user_id: int,
        now: datetime,
        late_window_hours: int,
        reason: Optional[str] = None,
    ) -> None:
        raise NotImplementedError

class DefaultStateMachine(BookingStateMachine):

    # ---------- CONFIRM ----------
    def can_confirm(self, booking: "Booking", now: datetime) -> Tuple[bool, Optional[str]]:
        if booking.status == BookingStatusEnum.CONFIRMED:
            return False, "Booking already confirmed"
        if booking.status in (BookingStatusEnum.CANCELLED, BookingStatusEnum.CANCELLED_LATE):
            return False, "Cannot confirm a cancelled booking"
        if booking.start_datetime <= now:
            return False, "Cannot confirm a booking in the past"
        # 👇 NUEVO: si está vencida (simulación de “pago/owner timeout”)
        if booking.expires_at is not None and booking.expires_at <= now:
            return False, "Booking expired"
        return True, None

    def confirm(self, booking: "Booking", by_user_id: int, at: datetime) -> None:
        ok, reason = self.can_confirm(booking, at)
        if not ok:
            raise ValueError(f"Cannot confirm booking: {reason}")
        booking.status = BookingStatusEnum.CONFIRMED

    # ---------- DECLINE (OWNER) ----------
    def can_decline(self, booking: "Booking", now: datetime) -> Tuple[bool, Optional[str]]:
        if booking.status not in (BookingStatusEnum.PENDING,):
            return False, f"Cannot decline booking in status {booking.status}"
        if booking.expires_at is not None and booking.expires_at <= now:
            return False, "Booking already expired"
        return True, None

    def decline(self, booking: "Booking", by_user_id: int, at: datetime) -> None:
        ok, reason = self.can_decline(booking, at)
        if not ok:
            raise ValueError(f"Cannot decline booking: {reason}")
        # Usamos CANCELLED como “declinado por owner” para no crear otro enum;
        # si preferís un estado distinto, podés agregar DECLINED.
        booking.status = BookingStatusEnum.CANCELLED

    # ---------- CANCEL (USER) ----------
    def can_cancel(
        self, booking: "Booking", now: datetime, late_window_hours: int
    ) -> Tuple[bool, bool, Optional[str]]:
        if booking.status in (BookingStatusEnum.CANCELLED, BookingStatusEnum.CANCELLED_LATE):
            return False, False, "Booking already cancelled"
        if booking.status not in (BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED):
            return False, False, f"Cannot cancel a booking in status {booking.status}"
        if now >= booking.end_datetime:
            return False, False, "Cannot cancel a booking that already ended"
        late_threshold = booking.start_datetime - timedelta(hours=late_window_hours)
        is_late = (now >= booking.start_datetime) or (now > late_threshold)
        return True, is_late, None

    def cancel(
        self,
        booking: "Booking",
        by_user_id: int,
        now: datetime,
        late_window_hours: int,
        reason: Optional[str] = None,
    ) -> None:
        allowed, is_late, why = self.can_cancel(booking, now, late_window_hours)
        if not allowed:
            raise ValueError(f"Cannot cancel booking: {why}")
        booking.status = BookingStatusEnum.CANCELLED_LATE if is_late else BookingStatusEnum.CANCELLED

    # ---------- EXPIRE (JOB) ----------
    def can_expire(self, booking: "Booking", now: datetime) -> Tuple[bool, Optional[str]]:
        if booking.status != BookingStatusEnum.PENDING:
            return False, "Only pending bookings can expire"
        if booking.expires_at is None or booking.expires_at > now:
            return False, "Not yet expired"
        return True, None

    def expire(self, booking: "Booking", at: datetime) -> None:
        ok, reason = self.can_expire(booking, at)
        if not ok:
            raise ValueError(f"Cannot expire booking: {reason}")
        # Si preferís tener el enum EXPIRED, activalo en tu BookingStatusEnum.
        # Si aún no lo agregaste, podés mapear a CANCELLED_LATE o CANCELLED.
        booking.status = BookingStatusEnum.CANCELLED  # o BookingStatusEnum.EXPIRED si lo agregás


class Booking(Base):
    __tablename__ = "bookings"

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

    ics_uid: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    ics_sequence: Mapped[int] = mapped_column(default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)

    __table_args__ = (
        Index("ix_bookings_court_start", "court_id", "start_datetime"),
        Index("ix_bookings_status_expires", "status", "expires_at"),
    )

    _state_machine: ClassVar[BookingStateMachine] = DefaultStateMachine()

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
