from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database.connection import get_engine
from app.ml.eta_model import get_eta_predictor


router = APIRouter(
    prefix="/prediction",
    tags=["Live Prediction"],
)


def get_latest_features(
    movement_type: str,
    movement_code: str,
):
    query = text("""
        SELECT
            movement_type,
            movement_code,
            recorded_at,
            distance_remaining_km,
            current_speed_kmph,
            average_speed_kmph,
            previous_delay_min,
            dwell_time_min,
            temperature_c,
            humidity_pct,
            rain_mm,
            wind_speed_kmph,
            traffic_level,
            hour_of_day,
            day_of_week
        FROM sim_ml_features
        WHERE movement_type = :movement_type
          AND movement_code = :movement_code
        ORDER BY recorded_at DESC
        LIMIT 1
    """)

    with get_engine().connect() as connection:
        row = connection.execute(
            query,
            {
                "movement_type": movement_type,
                "movement_code": movement_code,
            },
        ).mappings().first()

    return row


def predict_for_movement(
    movement_type: str,
    movement_code: str,
):
    row = get_latest_features(
        movement_type,
        movement_code,
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Movement not found",
        )

    predictor = get_eta_predictor()

    result = predictor.predict(
        distance_remaining_km=float(
            row["distance_remaining_km"]
        ),
        current_speed_kmph=float(
            row["current_speed_kmph"]
        ),
        average_speed_kmph=float(
            row["average_speed_kmph"]
        ),
        previous_delay_min=float(
            row["previous_delay_min"]
        ),
        dwell_time_min=float(
            row["dwell_time_min"]
        ),
        temperature_c=float(
            row["temperature_c"]
        ),
        humidity_pct=float(
            row["humidity_pct"]
        ),
        rain_mm=float(
            row["rain_mm"]
        ),
        wind_speed_kmph=float(
            row["wind_speed_kmph"]
        ),
        traffic_level=row["traffic_level"],
        hour_of_day=int(
            row["hour_of_day"]
        ),
        day_of_week=int(
            row["day_of_week"]
        ),
    )

    predicted_eta = (
        datetime.now()
        + timedelta(
            minutes=result[
                "predicted_travel_minutes"
            ]
        )
    )

    return {
        "movement_type": movement_type,
        "movement_code": movement_code,
        "recorded_at": row["recorded_at"],
        "predicted_travel_minutes": result[
            "predicted_travel_minutes"
        ],
        "predicted_delay_minutes": result[
            "predicted_delay_minutes"
        ],
        "predicted_eta": predicted_eta.isoformat(),
    }


@router.get("/train/{movement_code}")
def predict_train(movement_code: str):
    return predict_for_movement(
        "RAIL",
        movement_code,
    )


@router.get("/truck/{movement_code}")
def predict_truck(movement_code: str):
    return predict_for_movement(
        "ROAD",
        movement_code,
    )