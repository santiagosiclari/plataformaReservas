# app/services/geocoding.py
from typing import Optional, Tuple
import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

async def geocode_nominatim(address: str, city: Optional[str] = None) -> Optional[Tuple[float, float]]:
    query = f"{address}, {city}" if city else address
    headers = {"User-Agent": "tu-app/1.0 (contacto@tuapp.com)"}  # cámbialo por tu contacto real
    params = {"q": query, "format": "json", "limit": 1}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(NOMINATIM_URL, params=params, headers=headers)
        r.raise_for_status()
        data = r.json()
        if not data:
            return None
        return float(data[0]["lat"]), float(data[0]["lon"])
