from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator, HttpUrl
from app.shared.enums import SportEnum, SurfaceEnum

# ---- Address Validation ----
class AddressValidateRequest(BaseModel):
    region_code: str = Field("AR", description="Código de país, ej AR")
    address_lines: List[str] = Field(..., description="Calle y número, etc.")
    locality: Optional[str] = None
    administrative_area: Optional[str] = None
    postal_code: Optional[str] = None

class AddressValidateResponse(BaseModel):
    # Lo importante ya mapeado
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_formatted_address: Optional[str] = None
    address_components: Optional[dict] = None
    validated_address: bool = False

    # Original (opcional, por si querés debug)
    raw: Optional[dict] = None

# ---------- Venue ----------

class VenueBase(BaseModel):
    name: str
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    @model_validator(mode="after")
    def latlng_both_or_none(self):
        lat, lng = self.latitude, self.longitude
        if (lat is None) ^ (lng is None):  # XOR
            raise ValueError("Si envías coordenadas, deben incluir BOTH latitude y longitude.")
        return self

class VenueCreate(VenueBase):
    # En vez de address/city, recibimos lo necesario para validar con Google:
    region_code: str = Field("AR", description="Código de país ISO-3166-1 alpha-2, ej 'AR'")
    address_lines: List[str] = Field(..., description="Calle y número. Pueden ser varias líneas.")
    locality: Optional[str] = Field(None, description="Ciudad/Localidad (ayuda a validar)")
    administrative_area: Optional[str] = Field(None, description="Provincia/Estado (ayuda a validar)")
    postal_code: Optional[str] = Field(None, description="Código postal (si se conoce)")
    # (opcional) cuando más adelante integres Places:
    google_place_id: Optional[str] = None

# Para updates seguimos permitiendo tocar campos sueltos (por ahora mantenemos simple)
class VenueUpdate(BaseModel):
    name: Optional[str] = None
    # Si querés permitir actualizar lat/lng manualmente:
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
    address: str
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    google_place_id: Optional[str] = None
    google_formatted_address: Optional[str] = None
    validated_address: bool
    owner_user_id: int
    created_at: datetime
    photos: List[VenuePhotoOut] = Field(default_factory=list)

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
