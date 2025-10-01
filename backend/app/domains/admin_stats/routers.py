# app/routers/admin_stats.py
from datetime import datetime, date
from typing import Optional, List, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, literal_column
from app.deps import get_db, get_current_user, require_owner
from app.models.user import User
from app.models.venue import Venue
from app.models.court import Court
from app.models.booking import Booking
from app.models.enums import BookingStatusEnum
from app.schemas.admin_stats import (
    SummaryOut, TimeSeriesOut, Point, TopOut, TopItem, HeatmapOut, HeatCell
)

router = APIRouter(prefix="/admin/stats", tags=["admin-stats"])

def parse_range(from_: Optional[str], to_: Optional[str]):
    try:
        start = datetime.fromisoformat(from_) if from_ else None
        end = datetime.fromisoformat(to_) if to_ else None
    except Exception:
        raise HTTPException(status_code=400, detail="from/to inválidos (ISO 8601)")
    return start, end

def owned_venue_ids(db: Session, owner_id: int) -> List[int]:
    ids = db.scalars(select(Venue.id).where(Venue.owner_user_id == owner_id)).all()
    return list(ids)

def base_filters(owner_id: int, venue_id: Optional[int], court_id: Optional[int], db: Session):
    v_ids = owned_venue_ids(db, owner_id)
    if not v_ids:
        return None, v_ids
    conds = [Court.venue_id.in_(v_ids), Court.id == Booking.court_id]
    if venue_id:
        if venue_id not in v_ids:
            raise HTTPException(status_code=403, detail="No autorizado para ese venue")
        conds.append(Court.venue_id == venue_id)
    if court_id:
        conds.append(Booking.court_id == court_id)
    return and_(*conds), v_ids

@router.get("/summary", response_model=SummaryOut, dependencies=[Depends(require_owner)])
def summary(
    from_: Optional[str] = Query(None, alias="from"),
    to_: Optional[str] = Query(None, alias="to"),
    venue_id: Optional[int] = None,
    court_id: Optional[int] = None,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    start, end = parse_range(from_, to_)
    cond, v_ids = base_filters(me.id, venue_id, court_id, db)
    if v_ids is not None and not v_ids:
        return SummaryOut(
            bookings_total=0, revenue_total=0.0, cancellations=0, cancel_rate=0.0, active_courts=0, active_venues=0
        )

    q = select(Booking).join(Court, Court.id == Booking.court_id)
    if cond is not None:
        q = q.where(cond)
    if start:
        q = q.where(Booking.start_datetime >= start)
    if end:
        q = q.where(Booking.start_datetime < end)

    bookings = db.scalars(q).all()
    total = len(bookings)
    revenue = float(sum(b.price_total or 0 for b in bookings))
    cancels = sum(1 for b in bookings if b.status == BookingStatusEnum.CANCELLED)
    cancel_rate = (cancels / total) if total else 0.0

    active_courts = db.scalar(
        select(func.count(func.distinct(Court.id))).where(Court.venue_id.in_(v_ids))
    ) or 0
    active_venues = len(v_ids)

    return SummaryOut(
        bookings_total=total,
        revenue_total=revenue,
        cancellations=cancels,
        cancel_rate=round(cancel_rate, 4),
        active_courts=active_courts,
        active_venues=active_venues,
    )

def date_trunc_expr(col):
    # Postgres: func.date_trunc('day', col)
    # SQLite fallback: func.strftime('%Y-%m-%d', col)
    # Detectar por dialect:
    name = col.type.python_type.__name__  # no perfecto; mejor usar db.bind.dialect.name
    # Simplificamos: usamos strftime si sqlite, date_trunc si no.
    return None

@router.get("/bookings-per-day", response_model=TimeSeriesOut, dependencies=[Depends(require_owner)])
def bookings_per_day(
    from_: Optional[str] = Query(None, alias="from"),
    to_: Optional[str] = Query(None, alias="to"),
    venue_id: Optional[int] = None,
    court_id: Optional[int] = None,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    start, end = parse_range(from_, to_)
    cond, _ = base_filters(me.id, venue_id, court_id, db)

    # Dialect-aware grouping
    dialect = db.bind.dialect.name
    if dialect == "sqlite":
        day_expr = func.strftime("%Y-%m-%d", Booking.start_datetime)
    else:
        day_expr = func.to_char(func.date_trunc("day", Booking.start_datetime), "YYYY-MM-DD")

    q = (
        select(day_expr.label("d"), func.count(Booking.id))
        .select_from(Booking)
        .join(Court, Court.id == Booking.court_id)
    )
    if cond is not None:
        q = q.where(cond)
    if start:
        q = q.where(Booking.start_datetime >= start)
    if end:
        q = q.where(Booking.start_datetime < end)
    q = q.group_by(literal_column("d")).order_by(literal_column("d"))

    rows = db.execute(q).all()
    points = [Point(date=r[0], value=float(r[1])) for r in rows]
    return TimeSeriesOut(points=points)

@router.get("/revenue-per-day", response_model=TimeSeriesOut, dependencies=[Depends(require_owner)])
def revenue_per_day(
    from_: Optional[str] = Query(None, alias="from"),
    to_: Optional[str] = Query(None, alias="to"),
    venue_id: Optional[int] = None,
    court_id: Optional[int] = None,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    start, end = parse_range(from_, to_)
    cond, _ = base_filters(me.id, venue_id, court_id, db)

    dialect = db.bind.dialect.name
    if dialect == "sqlite":
        day_expr = func.strftime("%Y-%m-%d", Booking.start_datetime)
    else:
        day_expr = func.to_char(func.date_trunc("day", Booking.start_datetime), "YYYY-MM-DD")

    q = (
        select(day_expr.label("d"), func.coalesce(func.sum(Booking.price_total), 0))
        .select_from(Booking)
        .join(Court, Court.id == Booking.court_id)
    )
    if cond is not None:
        q = q.where(cond)
    if start:
        q = q.where(Booking.start_datetime >= start)
    if end:
        q = q.where(Booking.start_datetime < end)
    q = q.group_by(literal_column("d")).order_by(literal_column("d"))

    rows = db.execute(q).all()
    points = [Point(date=r[0], value=float(r[1])) for r in rows]
    return TimeSeriesOut(points=points)

@router.get("/top", response_model=TopOut, dependencies=[Depends(require_owner)])
def top(
    type: Literal["courts", "venues"] = "courts",
    limit: int = 5,
    from_: Optional[str] = Query(None, alias="from"),
    to_: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    start, end = parse_range(from_, to_)
    v_ids = owned_venue_ids(db, me.id)
    if not v_ids:
        return TopOut(items=[])

    base_q = select(
        Booking.court_id,
        func.count(Booking.id).label("bk"),
        func.coalesce(func.sum(Booking.price_total), 0).label("rev"),
    ).join(Court, Court.id == Booking.court_id)

    base_q = base_q.where(Court.venue_id.in_(v_ids))
    if start:
        base_q = base_q.where(Booking.start_datetime >= start)
    if end:
        base_q = base_q.where(Booking.start_datetime < end)
    base_q = base_q.group_by(Booking.court_id)

    rows = db.execute(base_q).all()
    by_court = {cid: (int(bk), float(rev)) for cid, bk, rev in rows}

    items: list[TopItem] = []
    if type == "courts":
        # nombre simple: "Court #X" (o traer Court.number/sport si querés)
        courts = db.scalars(select(Court).where(Court.id.in_(by_court.keys()))).all()
        for c in courts:
            bk, rev = by_court.get(c.id, (0, 0.0))
            name = f"Cancha {c.number or c.id} – {c.sport}"
            items.append(TopItem(id=c.id, name=name, bookings=bk, revenue=rev))
        items.sort(key=lambda x: (x.revenue, x.bookings), reverse=True)
        return TopOut(items=items[:limit])

    # Agrupar por venue
    from collections import defaultdict
    agg = defaultdict(lambda: [0, 0.0])  # venue_id -> [bk, rev]
    courts = db.scalars(select(Court).where(Court.id.in_(by_court.keys()))).all()
    for c in courts:
        bk, rev = by_court[c.id]
        agg[c.venue_id][0] += bk
        agg[c.venue_id][1] += rev

    vs = db.scalars(select(Venue).where(Venue.id.in_(list(agg.keys())))).all()
    for v in vs:
        bk, rev = agg[v.id]
        items.append(TopItem(id=v.id, name=v.name, bookings=bk, revenue=rev))
    items.sort(key=lambda x: (x.revenue, x.bookings), reverse=True)
    return TopOut(items=items[:limit])

@router.get("/heatmap", response_model=HeatmapOut, dependencies=[Depends(require_owner)])
def heatmap(
    from_: Optional[str] = Query(None, alias="from"),
    to_: Optional[str] = Query(None, alias="to"),
    venue_id: Optional[int] = None,
    court_id: Optional[int] = None,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    start, end = parse_range(from_, to_)
    cond, _ = base_filters(me.id, venue_id, court_id, db)

    # weekday (0..6) y hour (0..23)
    # Postgres: extract(dow/hour)
    # SQLite: strftime('%w' / '%H')
    dialect = db.bind.dialect.name
    if dialect == "sqlite":
        w = func.cast(func.strftime("%w", Booking.start_datetime), Integer)  # 0 domingo
        h = func.cast(func.strftime("%H", Booking.start_datetime), Integer)
    else:
        w = func.cast(func.extract("dow", Booking.start_datetime), Integer)
        h = func.cast(func.extract("hour", Booking.start_datetime), Integer)

    q = select(w.label("w"), h.label("h"), func.count(Booking.id)).select_from(Booking).join(Court, Court.id == Booking.court_id)
    if cond is not None:
        q = q.where(cond)
    if start:
        q = q.where(Booking.start_datetime >= start)
    if end:
        q = q.where(Booking.start_datetime < end)
    q = q.group_by(literal_column("w"), literal_column("h")).order_by(literal_column("w"), literal_column("h"))

    rows = db.execute(q).all()
    cells = [HeatCell(weekday=int(W), hour=int(H), count=int(C)) for (W, H, C) in rows]
    return HeatmapOut(cells=cells)
