from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator, HttpUrl
from app.shared.enums import SportEnum, SurfaceEnum

# ---------- Venue ----------

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

# ---------- Venue Photos ----------

class VenuePhotoBase(BaseModel):
    url: HttpUrl
    is_cover: bool = False
    sort_order: int = 0
    alt_text: Optional[str] = None

class VenuePhotoCreate(VenuePhotoBase):
    pass

class VenuePhotoUpdate(BaseModel):
    url: Optional[HttpUrl] = None
    is_cover: Optional[bool] = None
    sort_order: Optional[int] = None
    alt_text: Optional[str] = None

class VenuePhotoOut(VenuePhotoBase):
    id: int
    venue_id: int
    model_config = ConfigDict(from_attributes=True)

class VenueOut(VenueBase):
    id: int
    owner_user_id: int
    created_at: datetime
    photos: List[VenuePhotoOut] = Field(default_factory=list)  # 👈 inmutable
    model_config = ConfigDict(from_attributes=True)

# ---------- Court ----------

class CourtPhotoBase(BaseModel):
    url: HttpUrl
    is_cover: bool = False
    sort_order: int = 0
    alt_text: Optional[str] = None

class CourtPhotoCreate(CourtPhotoBase):
    pass

class CourtPhotoUpdate(BaseModel):
    url: Optional[HttpUrl] = None
    is_cover: Optional[bool] = None
    sort_order: Optional[int] = None
    alt_text: Optional[str] = None

class CourtPhotoOut(CourtPhotoBase):
    id: int
    court_id: int
    model_config = ConfigDict(from_attributes=True)

class CourtBase(BaseModel):
    sport: SportEnum
    surface: Optional[SurfaceEnum] = None
    indoor: bool = False
    number: Optional[str] = None
    notes: Optional[str] = None

class CourtCreate(CourtBase):
    @model_validator(mode="after")
    def validate_surface_by_sport(self):
        surf, sport = self.surface, self.sport
        if surf is None:
            return self
        allowed = {
            SportEnum.TENNIS: {SurfaceEnum.CLAY, SurfaceEnum.HARD, SurfaceEnum.GRASS, SurfaceEnum.OTHER},
            SportEnum.PADEL: {SurfaceEnum.SYNTHETIC_TURF, SurfaceEnum.HARD, SurfaceEnum.OTHER},
            SportEnum.FOOTBALL: {SurfaceEnum.SYNTHETIC_TURF, SurfaceEnum.GRASS, SurfaceEnum.OTHER},
            SportEnum.BASKET: {SurfaceEnum.PARQUET, SurfaceEnum.HARD, SurfaceEnum.OTHER},
            SportEnum.VOLLEY: {SurfaceEnum.SAND, SurfaceEnum.HARD, SurfaceEnum.OTHER},
        }
        if sport in allowed and surf not in allowed[sport]:
            raise ValueError(f"Superficie {surf} no válida para {sport}.")
        return self

class CourtUpdate(BaseModel):
    sport: Optional[SportEnum] = None
    surface: Optional[SurfaceEnum] = None
    indoor: Optional[bool] = None
    number: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_surface_by_sport_if_both(self):
        if self.sport is None or self.surface is None:
            return self
        surf, sport = self.surface, self.sport
        allowed = {
            SportEnum.TENNIS: {SurfaceEnum.CLAY, SurfaceEnum.HARD, SurfaceEnum.GRASS, SurfaceEnum.OTHER},
            SportEnum.PADEL: {SurfaceEnum.SYNTHETIC_TURF, SurfaceEnum.HARD, SurfaceEnum.OTHER},
            SportEnum.FOOTBALL: {SurfaceEnum.SYNTHETIC_TURF, SurfaceEnum.GRASS, SurfaceEnum.OTHER},
            SportEnum.BASKET: {SurfaceEnum.PARQUET, SurfaceEnum.HARD, SurfaceEnum.OTHER},
            SportEnum.VOLLEY: {SurfaceEnum.SAND, SurfaceEnum.HARD, SurfaceEnum.OTHER},
        }
        if sport in allowed and surf not in allowed[sport]:
            raise ValueError(f"Superficie {surf} no válida para {sport}.")
        return self

class CourtOut(CourtBase):
    id: int
    venue_id: int
    photos: List[CourtPhotoOut] = Field(default_factory=list)  # 👈 mantené fotos en el out
    model_config = ConfigDict(from_attributes=True)
