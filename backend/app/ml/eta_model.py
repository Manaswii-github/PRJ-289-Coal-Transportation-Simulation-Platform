import os
import joblib
import pandas as pd


MODEL_DIR = os.path.join(
    os.path.dirname(__file__),
    "models",
)

ETA_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "eta_model.pkl",
)

DELAY_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "delay_model.pkl",
)

METADATA_PATH = os.path.join(
    MODEL_DIR,
    "model_metadata.pkl",
)


class ETAPredictor:

    def __init__(self):
        if not os.path.exists(ETA_MODEL_PATH):
            raise FileNotFoundError(
                "ETA model not found. Run train_model.py first."
            )

        if not os.path.exists(DELAY_MODEL_PATH):
            raise FileNotFoundError(
                "Delay model not found. Run train_model.py first."
            )

        self.eta_model = joblib.load(
            ETA_MODEL_PATH
        )

        self.delay_model = joblib.load(
            DELAY_MODEL_PATH
        )

        self.metadata = joblib.load(
            METADATA_PATH
        )

        self.features = self.metadata["features"]

        self.traffic_mapping = (
            self.metadata["traffic_mapping"]
        )

    def predict(
        self,
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
        day_of_week,
    ):
        traffic_level = (
            traffic_level or "NONE"
        ).upper()

        traffic_encoded = (
            self.traffic_mapping.get(
                traffic_level,
                0,
            )
        )

        data = pd.DataFrame(
            [
                {
                    "distance_remaining_km": distance_remaining_km,
                    "current_speed_kmph": current_speed_kmph,
                    "average_speed_kmph": average_speed_kmph,
                    "previous_delay_min": previous_delay_min,
                    "dwell_time_min": dwell_time_min,
                    "temperature_c": temperature_c,
                    "humidity_pct": humidity_pct,
                    "rain_mm": rain_mm,
                    "wind_speed_kmph": wind_speed_kmph,
                    "traffic_level_encoded": traffic_encoded,
                    "hour_of_day": hour_of_day,
                    "day_of_week": day_of_week,
                }
            ]
        )

        predicted_travel_minutes = float(
            self.eta_model.predict(data)[0]
        )

        predicted_delay_minutes = float(
            self.delay_model.predict(data)[0]
        )

        predicted_travel_minutes = max(
            0,
            predicted_travel_minutes,
        )

        predicted_delay_minutes = max(
            0,
            predicted_delay_minutes,
        )

        return {
            "predicted_travel_minutes": round(
                predicted_travel_minutes,
                2,
            ),
            "predicted_delay_minutes": round(
                predicted_delay_minutes,
                2,
            ),
        }


_predictor = None


def get_eta_predictor():
    global _predictor

    if _predictor is None:
        _predictor = ETAPredictor()

    return _predictor