# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    JWT_SECRET_KEY: str = Field(..., min_length=32)  # pegá acá tu clave larga
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # dónde leer variables de entorno
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # por si aparecen vars extra en el entorno
    )

settings = Settings()
