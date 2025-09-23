from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

class VenueBase(BaseModel):
    name: str
    address: str
    city: str
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    @model_validator(mode="after")
    def latlng_both_or_none(self):
        lat, lng = self.latitude, self.longitude
        if (lat is None) ^ (lng is None):  # XOR
            raise ValueError("Si envías coordenadas, deben incluir BOTH latitude y longitude.")
        return self

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    @model_validator(mode="after")
    def latlng_both_or_none(self):
        lat, lng = self.latitude, self.longitude
        if (lat is None) ^ (lng is None):
            raise ValueError("Si envías coordenadas, deben incluir BOTH latitude y longitude.")
        return self

class VenueOut(VenueBase):
    id: int
    owner_user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
