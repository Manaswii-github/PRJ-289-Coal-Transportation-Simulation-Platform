import os
import joblib
import pandas as pd


from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor




FEATURE_COLUMNS = [
    "distance_remaining_km",
    "current_speed_kmph",
    "average_speed_kmph",
    "previous_delay_min",
    "dwell_time_min",
    "temperature_c",
    "humidity_pct",
    "rain_mm",
    "wind_speed_kmph",
    "traffic_level_encoded",
    "hour_of_day",
    "day_of_week",
]


def load_training_data():
    from app.database.connection import engine

    query = """
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
            day_of_week,
            actual_delay_min,
            actual_arrival
        FROM sim_ml_features
        WHERE actual_arrival IS NOT NULL
          AND distance_remaining_km >= 0
          AND current_speed_kmph >= 0
    """

    df = pd.read_sql(query, engine)

    return df

def prepare_data(df):
    df["traffic_level"] = df["traffic_level"].fillna("NONE")

    traffic_mapping = {
        "NONE": 0,
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
    }

    df["traffic_level_encoded"] = (
        df["traffic_level"]
        .str.upper()
        .map(traffic_mapping)
        .fillna(0)
    )

    df["recorded_at"] = pd.to_datetime(df["recorded_at"])
    df["actual_arrival"] = pd.to_datetime(df["actual_arrival"])

    df["remaining_travel_minutes"] = (
        df["actual_arrival"] - df["recorded_at"]
    ).dt.total_seconds() / 60

    df = df[df["remaining_travel_minutes"] >= 0]

    df = df.dropna(
        subset=[
            "distance_remaining_km",
            "current_speed_kmph",
            "average_speed_kmph",
            "previous_delay_min",
            "dwell_time_min",
            "temperature_c",
            "humidity_pct",
            "rain_mm",
            "wind_speed_kmph",
            "hour_of_day",
            "day_of_week",
            "actual_delay_min",
            "remaining_travel_minutes",
        ]
    )

    return df


def train_model(X, y):
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=42,
    )

    model.fit(X, y)

    return model


def evaluate_model(model, X_test, y_test, model_name):
    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    print()
    print(model_name)
    print("-------------------------")
    print(f"MAE  : {mae:.2f} minutes")
    print(f"RMSE : {rmse:.2f} minutes")


def main():
    print("Loading training data...")

    df = load_training_data()

    print(f"Rows loaded: {len(df)}")

    if len(df) < 20:
        raise RuntimeError(
            "Not enough ML training rows found."
        )

    df = prepare_data(df)

    print(f"Rows after preprocessing: {len(df)}")

    X = df[FEATURE_COLUMNS]

    y_eta = df["remaining_travel_minutes"]
    y_delay = df["actual_delay_min"]

    (
        X_train_eta,
        X_test_eta,
        y_train_eta,
        y_test_eta,
    ) = train_test_split(
        X,
        y_eta,
        test_size=0.2,
        random_state=42,
    )

    (
        X_train_delay,
        X_test_delay,
        y_train_delay,
        y_test_delay,
    ) = train_test_split(
        X,
        y_delay,
        test_size=0.2,
        random_state=42,
    )

    print()
    print("Training ETA model...")

    eta_model = train_model(
        X_train_eta,
        y_train_eta,
    )

    print("Training delay model...")

    delay_model = train_model(
        X_train_delay,
        y_train_delay,
    )

    evaluate_model(
        eta_model,
        X_test_eta,
        y_test_eta,
        "ETA MODEL",
    )

    evaluate_model(
        delay_model,
        X_test_delay,
        y_test_delay,
        "DELAY MODEL",
    )

    model_dir = os.path.join(
        os.path.dirname(__file__),
        "models",
    )

    os.makedirs(model_dir, exist_ok=True)

    eta_path = os.path.join(
        model_dir,
        "eta_model.pkl",
    )

    delay_path = os.path.join(
        model_dir,
        "delay_model.pkl",
    )

    metadata_path = os.path.join(
        model_dir,
        "model_metadata.pkl",
    )

    joblib.dump(eta_model, eta_path)
    joblib.dump(delay_model, delay_path)

    joblib.dump(
        {
            "features": FEATURE_COLUMNS,
            "traffic_mapping": {
                "NONE": 0,
                "LOW": 1,
                "MEDIUM": 2,
                "HIGH": 3,
            },
        },
        metadata_path,
    )

    print()
    print("Models saved:")
    print(eta_path)
    print(delay_path)
    print(metadata_path)


if __name__ == "__main__":
    main()