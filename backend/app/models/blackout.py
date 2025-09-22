from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Integer, Numeric, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class Blackout(Base):
    """
    Ventanas de bloqueo (mantenimiento, eventos privados, lluvia si querés cargarlo, etc.)
    """
    __tablename__ = "blackouts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id"), nullable=False, index=True)
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255))

    court: Mapped["Court"] = relationship(back_populates="blackouts")

    __table_args__ = (
        Index("ix_blackouts_court_start", "court_id", "start_datetime"),
    )

    def __repr__(self) -> str:
        return f"<Blackout court_id={self.court_id} {self.start_datetime}..{self.end_datetime}>"
