from __future__ import annotations
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.domains.venues.models import Venue
from app.domains.venues.schemas import VenueCreate
from app.shared.integrations.google_address import validate_address, extract_normalized_fields, AddressValidationError

async def create_venue_with_validation(db: Session, owner_user_id: int, data: VenueCreate) -> Venue:
    # 1) Validar dirección con Google
    try:
        raw = await validate_address(
            region_code=data.regionCode,
            address_lines=data.addressLines,
            locality=data.locality,
            administrative_area=data.administrativeArea,
            postal_code=data.postalCode,
        )
    except AddressValidationError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    normalized, ok = extract_normalized_fields(raw)
    if not ok:
        # Podrías devolver sugerencias al frontend (aquí simplifico)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La dirección no pudo validarse de forma completa. Por favor, verificá los datos."
        )

    # 2) Persistir Venue
    v = Venue(
        name=data.name,
        address=normalized.get("address") or "",
        city=normalized.get("city") or "",
        state=normalized.get("state"),
        postal_code=normalized.get("postal_code"),
        # si agregaste country_code en tu modelo, setéalo aquí:
        # country_code=normalized.get("country_code"),
        latitude=normalized.get("latitude"),
        longitude=normalized.get("longitude"),
        google_formatted_address=normalized.get("google_formatted_address"),
        address_components=normalized.get("address_components"),
        validated_address=True,
        owner_user_id=owner_user_id,
    )
    db.add(v)
    db.flush()  # obtiene id
    return v
