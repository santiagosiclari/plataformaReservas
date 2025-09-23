# app/models/booking_state_machine.py
from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional, Tuple

from .enums import BookingStatusEnum


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
    """Implementación por defecto: replica la lógica de dominio actual."""

    def can_confirm(self, booking: "Booking", now: datetime) -> Tuple[bool, Optional[str]]:
        if booking.status == BookingStatusEnum.CONFIRMED:
            return False, "Booking already confirmed"
        if booking.status in (BookingStatusEnum.CANCELLED, BookingStatusEnum.CANCELLED_LATE):
            return False, "Cannot confirm a cancelled booking"
        if booking.start_datetime <= now:
            return False, "Cannot confirm a booking in the past"
        return True, None

    def confirm(self, booking: "Booking", by_user_id: int, at: datetime) -> None:
        ok, reason = self.can_confirm(booking, at)
        if not ok:
            raise ValueError(f"Cannot confirm booking: {reason}")
        booking.status = BookingStatusEnum.CONFIRMED

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
