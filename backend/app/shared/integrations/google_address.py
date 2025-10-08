# integrations/google_address.py
from __future__ import annotations
from typing import Any, Dict, Optional, Tuple
import httpx
from app.core.config import settings

ADDRESS_VALIDATION_URL = "https://addressvalidation.googleapis.com/v1:validateAddress"

class AddressValidationError(Exception):
    pass

async def validate_address(
    *,
    region_code: str,
    address_lines: list[str],
    locality: Optional[str] = None,
    administrative_area: Optional[str] = None,
    postal_code: Optional[str] = None
) -> Dict[str, Any]:
    if not settings.GOOGLE_API_KEY:
        raise AddressValidationError("GOOGLE_API_KEY no configurada")

    # ✅ En Address Validation, los campos van DIRECTO en "address"
    address: Dict[str, Any] = {
        "regionCode": region_code,
        "addressLines": address_lines,
    }
    if locality:
        address["locality"] = locality
    if administrative_area:
        address["administrativeArea"] = administrative_area
    if postal_code:
        address["postalCode"] = postal_code

    payload: Dict[str, Any] = {
        "address": address,
        "previousResponseId": "",
        "enableUspsCass": False,   # irrelevante fuera de US
        # "languageCode": "es-AR", # opcional si querés respuestas en ES
    }

    params = {"key": settings.GOOGLE_API_KEY}

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(ADDRESS_VALIDATION_URL, params=params, json=payload)
        if r.status_code != 200:
            # Logueá payload para depurar rápidamente si vuelve a fallar
            # logger.warning("AddressValidation FAIL %s payload=%s resp=%s", r.status_code, payload, r.text)
            raise AddressValidationError(f"Google Address Validation error {r.status_code}: {r.text}")
        return r.json()

# Helper para extraer component por tipo
def _by_type(components: list[dict], t: str) -> str | None:
    for c in components or []:
        # Address Validation API suele traer algo como:
        # {"componentType":"locality","componentName":{"text":"Buenos Aires","languageCode":"es"}}
        if c.get("componentType") == t:
            name = c.get("componentName") or {}
            return name.get("text")
    return None

def extract_normalized_fields(raw: Dict[str, Any]) -> Tuple[Dict[str, Any], bool]:
    """
    Devuelve (normalized, ok)
    normalized keys: address, city, state, postal_code, country_code, latitude, longitude,
                     google_formatted_address, address_components
    """
    normalized: Dict[str, Any] = {
        "address": None,
        "city": None,
        "state": None,
        "postal_code": None,
        "country_code": None,
        "latitude": None,
        "longitude": None,
        "google_formatted_address": None,
        "address_components": None,
    }

    try:
        # Estructuras típicas de Address Validation:
        # - raw["result"]["address"]["formattedAddress"]
        # - raw["result"]["address"]["addressComponents"] (lista)
        # - raw["result"]["verdict"]["addressComplete"] (bool)
        # - raw["result"]["geocode"]["location"]["latitude"/"longitude"]
        result = (raw or {}).get("result") or {}
        addr = result.get("address") or {}
        comps = addr.get("addressComponents") or []
        verdict = (result.get("verdict") or {}).get("addressComplete")
        geocode = result.get("geocode") or {}
        loc = geocode.get("location") or {}

        normalized["google_formatted_address"] = addr.get("formattedAddress") or None
        normalized["address_components"] = comps or None

        # Campos por componentType
        country_code = _by_type(comps, "country")
        admin_area = _by_type(comps, "administrative_area_level_1") or _by_type(comps, "administrativeArea")
        locality = _by_type(comps, "locality") or _by_type(comps, "sublocality") or _by_type(comps, "postal_town")
        route = _by_type(comps, "route")
        street_number = _by_type(comps, "street_number")
        postal = _by_type(comps, "postal_code") or _by_type(comps, "postal_code_suffix")

        # Address línea 1: "Route street_number" si están, sino fallback al formattedAddress
        if route and street_number:
            normalized["address"] = f"{route} {street_number}"
        elif route:
            normalized["address"] = route
        else:
            # Fallback razonable
            normalized["address"] = addr.get("formattedAddress")

        # City/State/Postal/Country
        normalized["city"] = locality
        normalized["state"] = admin_area
        normalized["postal_code"] = postal
        normalized["country_code"] = country_code

        # Lat/Lng
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
            normalized["latitude"] = lat
            normalized["longitude"] = lng

        # Criterio de "ok":
        # - Requeridos mínimos: address, city, country_code
        # - Si no hay city pero hay formatted y country_code AR, aceptamos si verdict es True
        core_ok = bool(normalized["address"] and normalized["country_code"])
        city_ok = bool(normalized["city"])
        ok = (core_ok and city_ok) or (core_ok and bool(verdict))

        return normalized, ok
    except Exception:
        # En caso de cambios en el schema o edge cases, devolvé False para que el endpoint avise
        return normalized, False