from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class RakeResponse(BaseModel):
    id: int
    rake_id: str
    fnr: Optional[str] = None
    commodity: Optional[str] = None
    coal_grade: Optional[str] = None
    wagon_count: Optional[int] = None
    tonnage: Optional[Decimal] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    status: Optional[str] = None
    current_latitude: Optional[Decimal] = None
    current_longitude: Optional[Decimal] = None
    speed: Optional[Decimal] = None
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelemetryResponse(BaseModel):
    id: int
    rake_id: int
    latitude: Decimal
    longitude: Decimal
    speed: Optional[Decimal] = None
    recorded_at: datetime
    source: Optional[str] = None

    class Config:
        from_attributes = True


class TelemetryCreate(BaseModel):
    latitude: Decimal
    longitude: Decimal
    speed: Optional[Decimal] = None
    recorded_at: datetime
    source: Optional[str] = None