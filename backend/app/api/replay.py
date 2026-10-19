from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from app.database.connection import get_engine
from app.ml.eta_model import get_eta_predictor


router = APIRouter(
    prefix="/simulation",
    tags=["simulation-replay"],
)


def _parse_timestamp(value: str) -> datetime:
    value = value.strip().replace("Z", "")

    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                "timestamp must be ISO format, "
                "for example 2026-09-20T06:00:00"
            ),
        ) from exc


def _float(value):
    if value is None:
        return None
    return float(value)


def _iso(value):
    if value is None:
        return None
    return value.isoformat()


def _load_movements():
    rail_sql = text(
        """
        SELECT
            'RAIL' AS movement_type,
            movement_code,
            rake_id AS vehicle_id,
            rail_id AS internal_id,
            route_id,
            source_name,
            destination_name,
            coal_grade,
            wagon_count,
            tonnage,
            scheduled_departure,
            actual_arrival,
            status,
            delay_min AS master_delay_min
        FROM sim_rail_movements
        """
    )

    truck_sql = text(
        """
        SELECT
            'ROAD' AS movement_type,
            truck_code AS movement_code,
            shipment_code AS vehicle_id,
            truck_id AS internal_id,
            route_id,
            source_name,
            destination_name,
            coal_grade,
            NULL AS wagon_count,
            load_t AS tonnage,
            scheduled_departure,
            actual_arrival,
            status,
            delay_min AS master_delay_min
        FROM sim_trucks
        """
    )

    route_sql = text(
        """
        SELECT
            route_id,
            distance_km,
            source_lat,
            source_lon,
            destination_lat,
            destination_lon
        FROM sim_routes
        """
    )

    rail_telemetry_sql = text(
        """
        SELECT
            rail_id,
            recorded_at,
            latitude,
            longitude,
            speed_kmph,
            distance_travelled_km,
            distance_remaining_km,
            segment_name,
            delay_min
        FROM sim_rail_telemetry
        ORDER BY rail_id, recorded_at
        """
    )

    truck_telemetry_sql = text(
        """
        SELECT
            truck_id,
            recorded_at,
            latitude,
            longitude,
            speed_kmph,
            distance_travelled_km,
            distance_remaining_km,
            road_segment AS segment_name,
            delay_min
        FROM sim_truck_telemetry
        ORDER BY truck_id, recorded_at
        """
    )

    with get_engine().connect() as connection:
        rails = (
            connection.execute(rail_sql)
            .mappings()
            .all()
        )

        trucks = (
            connection.execute(truck_sql)
            .mappings()
            .all()
        )

        routes = (
            connection.execute(route_sql)
            .mappings()
            .all()
        )

        rail_telemetry = (
            connection.execute(rail_telemetry_sql)
            .mappings()
            .all()
        )

        truck_telemetry = (
            connection.execute(truck_telemetry_sql)
            .mappings()
            .all()
        )

    route_map = {
        int(row["route_id"]): row
        for row in routes
    }

    rail_telemetry_map = {}
    for row in rail_telemetry:
        rail_telemetry_map.setdefault(
            int(row["rail_id"]),
            [],
        ).append(row)

    truck_telemetry_map = {}
    for row in truck_telemetry:
        truck_telemetry_map.setdefault(
            int(row["truck_id"]),
            [],
        ).append(row)

    return (
        list(rails) + list(trucks),
        route_map,
        rail_telemetry_map,
        truck_telemetry_map,
    )


def _nearest_telemetry(
    rows,
    sim_time: datetime,
):
    if not rows:
        return None

    return min(
        rows,
        key=lambda row: abs(
            (
                row["recorded_at"] -
                sim_time
            ).total_seconds()
        ),
    )


def _movement_row(
    row,
    sim_time: datetime,
    route,
    telemetry,
):
    source_lat = float(route["source_lat"])
    source_lon = float(route["source_lon"])
    destination_lat = float(route["destination_lat"])
    destination_lon = float(route["destination_lon"])

    departure = row["scheduled_departure"]
    arrival = row["actual_arrival"]

    distance = float(route["distance_km"])

    if telemetry is not None:
        latitude = float(telemetry["latitude"])
        longitude = float(telemetry["longitude"])
        speed = float(telemetry["speed_kmph"])
        travelled = float(
            telemetry["distance_travelled_km"]
        )
        remaining = float(
            telemetry["distance_remaining_km"]
        )
        delay_min = float(
            telemetry["delay_min"] or 0
        )
        telemetry_time = telemetry["recorded_at"]
        segment = telemetry["segment_name"]
    else:
        latitude = source_lat
        longitude = source_lon
        speed = 0.0
        travelled = 0.0
        remaining = distance
        delay_min = float(
            row["master_delay_min"] or 0
        )
        telemetry_time = None
        segment = "NO_TELEMETRY"

    if telemetry_time is not None:
        if telemetry_time <= departure:
            replay_status = "PLANNED"
        elif telemetry_time >= arrival:
            replay_status = (
                "DELIVERED"
                if row["movement_type"] == "ROAD"
                else "ARRIVED"
            )
        elif delay_min > 0:
            replay_status = "DELAYED"
        else:
            replay_status = "IN_TRANSIT"
    else:
        replay_status = "PLANNED"

    progress = (
        travelled / distance
        if distance > 0
        else 0.0
    )

    progress = max(
        0.0,
        min(1.0, progress),
    )

    predicted_delay_min = None
    predicted_eta = None

    # Only predict for movements that have not yet arrived and still have
    # distance remaining. Actual recorded delay remains in delay_min; the
    # model output is kept separately in predicted_delay_min.
    is_active = (
        departure <= sim_time < arrival
        and remaining > 0
    )

    if is_active:
        try:
            predictor = get_eta_predictor()
            average_speed = speed if speed > 0 else (
                distance / max(
                    (arrival - departure).total_seconds() / 3600,
                    1 / 60,
                )
            )
            prediction = predictor.predict(
                distance_remaining_km=max(0.0, remaining),
                current_speed_kmph=max(0.0, speed),
                average_speed_kmph=max(0.0, average_speed),
                previous_delay_min=max(0.0, delay_min),
                dwell_time_min=0.0,
                temperature_c=25.0,
                humidity_pct=60.0,
                rain_mm=0.0,
                wind_speed_kmph=0.0,
                traffic_level="NONE",
                hour_of_day=sim_time.hour,
                day_of_week=sim_time.weekday(),
            )
            predicted_delay_min = prediction.get(
                "predicted_delay_minutes"
            )
            travel_minutes = prediction.get(
                "predicted_travel_minutes"
            )
            if travel_minutes is not None:
                from datetime import timedelta
                predicted_eta = (
                    sim_time + timedelta(minutes=float(travel_minutes))
                ).isoformat()
        except (FileNotFoundError, ValueError, TypeError, KeyError) as exc:
            # Keep replay available if model artifacts are missing or invalid.
            # The fields stay null so the UI won't mistake actual delay for a prediction.
            import logging
            logging.getLogger(__name__).warning(
                "ML prediction unavailable for %s: %s",
                row["movement_code"],
                exc,
            )

    return {
        "movement_type": row["movement_type"],
        "movement_code": row["movement_code"],
        "vehicle_id": row["vehicle_id"],
        "route_id": row["route_id"],
        "source_name": row["source_name"],
        "destination_name": row["destination_name"],
        "source_lat": source_lat,
        "source_lon": source_lon,
        "destination_lat": destination_lat,
        "destination_lon": destination_lon,
        "coal_grade": row["coal_grade"],
        "wagon_count": row["wagon_count"],
        "tonnage": _float(row["tonnage"]),
        "scheduled_departure": _iso(departure),
        "actual_arrival": _iso(arrival),
        "requested_timestamp": sim_time.isoformat(),
        "telemetry_time": _iso(telemetry_time),
        "nearest_telemetry_timestamp": _iso(telemetry_time),
        "latitude": latitude,
        "longitude": longitude,
        "speed_kmph": speed,
        "distance_travelled_km": travelled,
        "distance_remaining_km": remaining,
        "replay_status": replay_status,
        "delay_min": delay_min,
        "previous_delay_min": delay_min,
        "predicted_delay_min": predicted_delay_min,
        "predicted_eta": predicted_eta,
        "progress": progress,
        "segment": segment,
        "source": "SIMULATION_REPLAY_NEAREST_TELEMETRY",
    }


@router.get("/state")
def get_simulation_state(
    timestamp: str = Query(
        ...,
        description="Simulation timestamp",
    ),
) -> Dict[str, Any]:
    sim_time = _parse_timestamp(timestamp)

    (
        movements,
        route_map,
        rail_telemetry_map,
        truck_telemetry_map,
    ) = _load_movements()

    selected_date = sim_time.date()

    trains: List[Dict[str, Any]] = []
    trucks: List[Dict[str, Any]] = []

    for row in movements:
        departure = row["scheduled_departure"]
        arrival = row["actual_arrival"]

        if (
            departure.date() != selected_date
            and arrival.date() != selected_date
        ):
            continue

        route = route_map.get(
            int(row["route_id"])
        )

        if route is None:
            continue

        if row["movement_type"] == "RAIL":
            telemetry = _nearest_telemetry(
                rail_telemetry_map.get(
                    int(row["internal_id"]),
                    [],
                ),
                sim_time,
            )
        else:
            telemetry = _nearest_telemetry(
                truck_telemetry_map.get(
                    int(row["internal_id"]),
                    [],
                ),
                sim_time,
            )

        item = _movement_row(
            row,
            sim_time,
            route,
            telemetry,
        )

        if row["movement_type"] == "RAIL":
            trains.append(item)
        else:
            trucks.append(item)

    trains.sort(
        key=lambda item: item["movement_code"]
    )

    trucks.sort(
        key=lambda item: item["movement_code"]
    )

    return {
        "simulation_time": sim_time.isoformat(),
        "requested_timestamp": sim_time.isoformat(),
        "nearest_telemetry_timestamp": None,
        "mode": "HISTORICAL_REPLAY",
        "movement_count": (
            len(trains) + len(trucks)
        ),
        "trains": trains,
        "trucks": trucks,
        "movements": trains + trucks,
    }


@router.get("/routes/{route_id}")
def get_simulation_route(
    route_id: int,
) -> Dict[str, Any]:
    sql = text(
        """
        SELECT
            route_id,
            point_sequence,
            latitude,
            longitude
        FROM sim_route_points
        WHERE route_id = :route_id
        ORDER BY point_sequence
        """
    )

    with get_engine().connect() as connection:
        rows = (
            connection.execute(
                sql,
                {"route_id": route_id},
            )
            .mappings()
            .all()
        )

    points = [
        [
            float(row["latitude"]),
            float(row["longitude"]),
        ]
        for row in rows
    ]

    return {
        "route_id": route_id,
        "points": points,
    }


@router.get("/movement/{movement_code}")
def get_simulation_movement(
    movement_code: str,
) -> Dict[str, Any]:
    code = movement_code.strip().upper()

    (
        movements,
        route_map,
        rail_telemetry_map,
        truck_telemetry_map,
    ) = _load_movements()

    row = next(
        (
            item
            for item in movements
            if str(
                item["movement_code"]
            ).upper() == code
        ),
        None,
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Movement {code} not found",
        )

    route = route_map.get(
        int(row["route_id"])
    )

    if route is None:
        raise HTTPException(
            status_code=404,
            detail=f"Route for {code} not found",
        )

    if row["movement_type"] == "RAIL":
        telemetry = (
            rail_telemetry_map.get(
                int(row["internal_id"]),
                [],
            )[0]
            if rail_telemetry_map.get(
                int(row["internal_id"]),
                [],
            )
            else None
        )
    else:
        telemetry = (
            truck_telemetry_map.get(
                int(row["internal_id"]),
                [],
            )[0]
            if truck_telemetry_map.get(
                int(row["internal_id"]),
                [],
            )
            else None
        )

    return _movement_row(
        row,
        row["scheduled_departure"],
        route,
        telemetry,
    )


@router.get("/range")
def get_simulation_range() -> Dict[str, Optional[str]]:
    sql = text(
        """
        SELECT
            MIN(start_time) AS min_time,
            MAX(end_time) AS max_time
        FROM (
            SELECT
                MIN(scheduled_departure) AS start_time,
                MAX(actual_arrival) AS end_time
            FROM sim_rail_movements

            UNION ALL

            SELECT
                MIN(scheduled_departure) AS start_time,
                MAX(actual_arrival) AS end_time
            FROM sim_trucks
        ) x
        """
    )

    with get_engine().connect() as connection:
        row = (
            connection.execute(sql)
            .mappings()
            .first()
        )

    return {
        "min_time": _iso(
            row["min_time"]
            if row
            else None
        ),
        "max_time": _iso(
            row["max_time"]
            if row
            else None
        ),
    }
