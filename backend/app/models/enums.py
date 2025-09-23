from enum import Enum

class RoleEnum(str, Enum):
    PLAYER = "PLAYER"
    OWNER = "OWNER"
    ADMIN = "ADMIN"

class SportEnum(str, Enum):
    PADEL = "PADEL"
    FOOTBALL = "FOOTBALL"

class BookingStatusEnum(str, Enum):
    PENDING = "PENDING"        # recién creada, a la espera de confirmación
    CONFIRMED = "CONFIRMED"    # confirmada por OWNER (o pago en el futuro)
    CANCELLED = "CANCELLED"    # cancelada a tiempo, sin penalidad
    CANCELLED_LATE = "CANCELLED_LATE"  # cancelada fuera de plazo (puede implicar penalidad)
    """ EXPIRED: nunca se confirmó y se venció el tiempo límite.
    NO_SHOW: el usuario no se presentó.
    REFUNDED: se procesó devolución tras confirmación y cancelación. """