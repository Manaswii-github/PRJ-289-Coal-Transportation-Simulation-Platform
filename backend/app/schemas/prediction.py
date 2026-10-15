from typing import Optional

from pydantic import BaseModel


class ETAPredictionRequest(BaseModel):
    distance_remaining_km: float
    current_speed_kmph: float
    average_speed_kmph: float
    previous_delay_min: float
    dwell_time_min: float
    temperature_c: float
    humidity_pct: float
    rain_mm: float
    wind_speed_kmph: float
    traffic_level: str
    hour_of_day: int
    day_of_week: int


class ETAPredictionResponse(BaseModel):
    predicted_travel_minutes: float
    predicted_delay_minutes: float
    predicted_eta: Optional[str] = None