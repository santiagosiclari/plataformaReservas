# schemas/user
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
import phonenumbers
from app.models.enums import RoleEnum

DEFAULT_REGION = "AR"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: Optional[RoleEnum] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]):
        if not v:
            return None
        num = phonenumbers.parse(v, DEFAULT_REGION)
        if not (phonenumbers.is_possible_number(num) and phonenumbers.is_valid_number(num)):
            raise ValueError("Teléfono inválido")
        return phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164)

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: RoleEnum
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserRoleUpdate(BaseModel):
    role: RoleEnum

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]):
        if not v:
            return None
        num = phonenumbers.parse(v, DEFAULT_REGION)
        if not (phonenumbers.is_possible_number(num) and phonenumbers.is_valid_number(num)):
            raise ValueError("Teléfono inválido")
        return phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164)