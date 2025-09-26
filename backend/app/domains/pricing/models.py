from datetime import time
from sqlalchemy import Time, Integer, Numeric, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class Price(Base):
    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id"), nullable=False, index=True)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0..6
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    price_per_slot: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    court = relationship("Court", back_populates="prices")

    __table_args__ = (
        Index("uq_price_rule", "court_id", "weekday", "start_time", "end_time", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Price court_id={self.court_id} weekday={self.weekday} {self.start_time}-{self.end_time}>"
