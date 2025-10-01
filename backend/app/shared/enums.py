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
    PENDING = "PENDING"        # recién creada, a la espera de confirmación
    CONFIRMED = "CONFIRMED"    # confirmada por OWNER (o pago en el futuro)
    CANCELLED = "CANCELLED"    # cancelada a tiempo, sin penalidad
    CANCELLED_LATE = "CANCELLED_LATE"  # cancelada fuera de plazo (puede implicar penalidad)
    """ EXPIRED: nunca se confirmó y se venció el tiempo límite.
    NO_SHOW: el usuario no se presentó.
    REFUNDED: se procesó devolución tras confirmación y cancelación. """