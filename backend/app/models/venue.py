from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255))
    city: Mapped[Optional[str]] = mapped_column(String(120))

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
