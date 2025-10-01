from datetime import time
from sqlalchemy import Integer, Time, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class CourtSchedule(Base):
    __tablename__ = "court_schedules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id"), nullable=False, index=True)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0..6
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)

    court = relationship("Court", back_populates="schedules")

    __table_args__ = (
        Index("uq_schedule_court_day", "court_id", "weekday", unique=True),
    )

    def __repr__(self) -> str:
        return f"<CourtSchedule court_id={self.court_id} weekday={self.weekday}>"
