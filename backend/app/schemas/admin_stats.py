# app/schemas/admin_stats.py
from pydantic import BaseModel
from typing import List, Optional, Literal

class SummaryOut(BaseModel):
    bookings_total: int
    revenue_total: float
    cancellations: int
    cancel_rate: float
    active_courts: int
    active_venues: int

class Point(BaseModel):
    date: str  # 'YYYY-MM-DD'
    value: float

class TimeSeriesOut(BaseModel):
    points: List[Point]

class TopItem(BaseModel):
    id: int
    name: str
    bookings: int
    revenue: float

class TopOut(BaseModel):
    items: List[TopItem]

class HeatCell(BaseModel):
    weekday: int  # 0..6
    hour: int     # 0..23
    count: int

class HeatmapOut(BaseModel):
    cells: List[HeatCell]
