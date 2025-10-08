# venues/integrations.py
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.domains.venues.schemas import AddressValidateRequest, AddressValidateResponse
from app.shared.integrations.google_address import validate_address, extract_normalized_fields, AddressValidationError

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.post("/address/validate", response_model=AddressValidateResponse)
async def address_validate(payload: AddressValidateRequest):
    try:
        raw = await validate_address(
            region_code=payload.region_code,
            address_lines=payload.address_lines,
            locality=payload.locality,
            administrative_area=payload.administrative_area,
            postal_code=payload.postal_code,
        )
        normalized, ok = extract_normalized_fields(raw)
        return AddressValidateResponse(**normalized, validated_address=ok, raw=raw)
    except AddressValidationError as e:
        raise HTTPException(status_code=502, detail=str(e))
