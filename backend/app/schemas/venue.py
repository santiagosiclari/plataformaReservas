from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class VenueBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

class VenueOut(VenueBase):
    id: int
    owner_user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
