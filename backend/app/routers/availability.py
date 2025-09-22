from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date

router = APIRouter(prefix="/courts", tags=["availability"])

@router.get("/{court_id}/availability")
def get_availability(court_id: int, date_str: str = Query(..., alias="date")):
    # TODO: leer schedules, bookings, blackouts y construir slots
    try:
        _ = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")
    return {"court_id": court_id, "date": date_str, "slots": []}
