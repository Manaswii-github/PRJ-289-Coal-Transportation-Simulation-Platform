from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

from app.ml.eta_model import get_eta_predictor
from app.schemas.prediction import (
    ETAPredictionRequest,
    ETAPredictionResponse,
)


router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"],
)


@router.post(
    "/eta",
    response_model=ETAPredictionResponse,
)
def predict_eta(data: ETAPredictionRequest):

    try:
        predictor = get_eta_predictor()

        result = predictor.predict(
            distance_remaining_km=data.distance_remaining_km,
            current_speed_kmph=data.current_speed_kmph,
            average_speed_kmph=data.average_speed_kmph,
            previous_delay_min=data.previous_delay_min,
            dwell_time_min=data.dwell_time_min,
            temperature_c=data.temperature_c,
            humidity_pct=data.humidity_pct,
            rain_mm=data.rain_mm,
            wind_speed_kmph=data.wind_speed_kmph,
            traffic_level=data.traffic_level,
            hour_of_day=data.hour_of_day,
            day_of_week=data.day_of_week,
        )

        predicted_eta = (
            datetime.now()
            + timedelta(
                minutes=result["predicted_travel_minutes"]
            )
        )

        return ETAPredictionResponse(
            predicted_travel_minutes=result[
                "predicted_travel_minutes"
            ],
            predicted_delay_minutes=result[
                "predicted_delay_minutes"
            ],
            predicted_eta=predicted_eta.isoformat(),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )