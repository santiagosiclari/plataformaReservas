from enum import Enum

class RoleEnum(str, Enum):
    PLAYER = "PLAYER"
    OWNER = "OWNER"
    ADMIN = "ADMIN"

class SportEnum(str, Enum):
    TENNIS = "TENNIS"
    PADEL = "PADEL"
    FOOTBALL = "FOOTBALL"
    BASKET = "BASKET"
    VOLLEY = "VOLLEY"

class SurfaceEnum(str, Enum):
    CLAY = "CLAY"                 # polvo de ladrillo
    HARD = "HARD"                 # cemento/hard
    GRASS = "GRASS"               # césped
    SYNTHETIC_TURF = "SYNTHETIC_TURF"  # sintético (fútbol)
    PARQUET = "PARQUET"           # parquet (básquet/indoor)
    SAND = "SAND"                 # arena (beach volley)
    OTHER = "OTHER"

class BookingStatusEnum(str, Enum):
    PENDING = "PENDING"              # recién creada, esperando confirmación del OWNER
    CONFIRMED = "CONFIRMED"          # confirmada (por owner, o en futuro: pago ok)
    CANCELLED = "CANCELLED"          # cancelada dentro de plazo, sin penalidad
    CANCELLED_LATE = "CANCELLED_LATE" # cancelada fuera de plazo (puede implicar penalidad)
    EXPIRED = "EXPIRED"              # nunca se confirmó en el tiempo límite
    NO_SHOW = "NO_SHOW"              # usuario no se presentó
    REFUNDED = "REFUNDED"            # devolución procesada

class RoleRequestStatus(str, Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"