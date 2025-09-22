from enum import Enum

class RoleEnum(str, Enum):
    PLAYER = "PLAYER"
    OWNER = "OWNER"
    SUPER = "SUPER"

class SportEnum(str, Enum):
    PADEL = "PADEL"
    FOOTBALL = "FOOTBALL"

class BookingStatusEnum(str, Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    CANCELLED_LATE = "CANCELLED_LATE"
