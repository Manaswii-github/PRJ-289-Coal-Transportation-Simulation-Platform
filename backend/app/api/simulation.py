from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database.connection import get_engine


router = APIRouter(
    prefix="/simulation",
    tags=["Simulation"]
)


@router.get("/trains")
def get_trains():
    query = text("""
        SELECT
            r.rail_id,
            r.movement_code,
            r.rake_id,
            r.route_id,
            r.source_name,
            r.destination_name,
            r.coal_grade,
            r.wagon_count,
            r.tonnage,
            r.current_lat,
            r.current_lon,
            r.current_speed_kmph,
            r.distance_travelled_km,
            r.distance_remaining_km,
            r.previous_delay_min,
            r.predicted_delay_min,
            r.predicted_eta,
            r.status,
            r.simulation_state,
            rt.route_code
        FROM sim_rail_movements r
        JOIN sim_routes rt
            ON rt.route_id = r.route_id
        ORDER BY r.movement_code
    """)

    with get_engine().connect() as connection:
        rows = connection.execute(query).mappings().all()

    return [
        {
            "id": row["rail_id"],
            "movement_code": row["movement_code"],
            "vehicle_type": "RAIL",
            "vehicle_id": row["rake_id"],
            "route_id": row["route_id"],
            "route_code": row["route_code"],
            "source": row["source_name"],
            "destination": row["destination_name"],
            "coal_grade": row["coal_grade"],
            "wagon_count": row["wagon_count"],
            "tonnage": float(row["tonnage"]),
            "latitude": float(row["current_lat"]),
            "longitude": float(row["current_lon"]),
            "speed": float(row["current_speed_kmph"]),
            "distance_travelled": float(row["distance_travelled_km"]),
            "distance_remaining": float(row["distance_remaining_km"]),
            "previous_delay": float(row["previous_delay_min"]),
            "predicted_delay": (
                float(row["predicted_delay_min"])
                if row["predicted_delay_min"] is not None
                else None
            ),
            "predicted_eta": (
                row["predicted_eta"].isoformat()
                if row["predicted_eta"] is not None
                else None
            ),
            "status": row["status"],
            "simulation_state": row["simulation_state"]
        }
        for row in rows
    ]


@router.get("/trucks")
def get_trucks():
    query = text("""
        SELECT
            t.truck_id,
            t.truck_code,
            t.shipment_code,
            t.route_id,
            t.source_name,
            t.destination_name,
            t.coal_grade,
            t.capacity_t,
            t.load_t,
            t.current_lat,
            t.current_lon,
            t.current_speed_kmph,
            t.distance_travelled_km,
            t.distance_remaining_km,
            t.previous_delay_min,
            t.predicted_delay_min,
            t.predicted_eta,
            t.traffic_level,
            t.status,
            t.simulation_state,
            rt.route_code
        FROM sim_trucks t
        JOIN sim_routes rt
            ON rt.route_id = t.route_id
        ORDER BY t.truck_code
    """)

    with get_engine().connect() as connection:
        rows = connection.execute(query).mappings().all()

    return [
        {
            "id": row["truck_id"],
            "movement_code": row["truck_code"],
            "vehicle_type": "ROAD",
            "vehicle_id": row["truck_code"],
            "shipment_code": row["shipment_code"],
            "route_id": row["route_id"],
            "route_code": row["route_code"],
            "source": row["source_name"],
            "destination": row["destination_name"],
            "coal_grade": row["coal_grade"],
            "capacity": float(row["capacity_t"]),
            "load": float(row["load_t"]),
            "latitude": float(row["current_lat"]),
            "longitude": float(row["current_lon"]),
            "speed": float(row["current_speed_kmph"]),
            "distance_travelled": float(row["distance_travelled_km"]),
            "distance_remaining": float(row["distance_remaining_km"]),
            "previous_delay": float(row["previous_delay_min"]),
            "predicted_delay": (
                float(row["predicted_delay_min"])
                if row["predicted_delay_min"] is not None
                else None
            ),
            "predicted_eta": (
                row["predicted_eta"].isoformat()
                if row["predicted_eta"] is not None
                else None
            ),
            "traffic_level": row["traffic_level"],
            "status": row["status"],
            "simulation_state": row["simulation_state"]
        }
        for row in rows
    ]


@router.get("/movement/{movement_code}")
def get_movement(movement_code: str):
    train_query = text("""
        SELECT
            r.rail_id AS id,
            r.movement_code,
            'RAIL' AS vehicle_type,
            r.rake_id AS vehicle_id,
            r.route_id,
            rt.route_code,
            r.source_name AS source,
            r.destination_name AS destination,
            r.coal_grade,
            r.wagon_count,
            r.tonnage,
            r.current_lat AS latitude,
            r.current_lon AS longitude,
            r.current_speed_kmph AS speed,
            r.distance_travelled_km AS distance_travelled,
            r.distance_remaining_km AS distance_remaining,
            r.previous_delay_min AS previous_delay,
            r.predicted_delay_min AS predicted_delay,
            r.predicted_eta,
            r.status,
            r.simulation_state
        FROM sim_rail_movements r
        JOIN sim_routes rt
            ON rt.route_id = r.route_id
        WHERE r.movement_code = :movement_code
        LIMIT 1
    """)

    truck_query = text("""
        SELECT
            t.truck_id AS id,
            t.truck_code AS movement_code,
            'ROAD' AS vehicle_type,
            t.truck_code AS vehicle_id,
            t.route_id,
            rt.route_code,
            t.source_name AS source,
            t.destination_name AS destination,
            t.coal_grade,
            t.capacity_t AS capacity,
            t.load_t AS load,
            t.current_lat AS latitude,
            t.current_lon AS longitude,
            t.current_speed_kmph AS speed,
            t.distance_travelled_km AS distance_travelled,
            t.distance_remaining_km AS distance_remaining,
            t.previous_delay_min AS previous_delay,
            t.predicted_delay_min AS predicted_delay,
            t.predicted_eta,
            t.traffic_level,
            t.status,
            t.simulation_state
        FROM sim_trucks t
        JOIN sim_routes rt
            ON rt.route_id = t.route_id
        WHERE t.truck_code = :movement_code
        LIMIT 1
    """)

    with get_engine().connect() as connection:
        row = connection.execute(
            train_query,
            {"movement_code": movement_code}
        ).mappings().first()

        if row is None:
            row = connection.execute(
                truck_query,
                {"movement_code": movement_code}
            ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Movement {movement_code} not found"
        )

    result = dict(row)

    for key in [
        "tonnage",
        "capacity",
        "load",
        "latitude",
        "longitude",
        "speed",
        "distance_travelled",
        "distance_remaining",
        "previous_delay",
        "predicted_delay"
    ]:
        if result.get(key) is not None:
            result[key] = float(result[key])

    if result.get("predicted_eta") is not None:
        result["predicted_eta"] = (
            result["predicted_eta"].isoformat()
        )

    return result


@router.get("/routes/{route_id}")
def get_route(route_id: int):
    route_query = text("""
        SELECT
            route_id,
            route_code,
            movement_type,
            source_name,
            destination_name,
            source_lat,
            source_lon,
            destination_lat,
            destination_lon,
            distance_km,
            route_status
        FROM sim_routes
        WHERE route_id = :route_id
    """)

    points_query = text("""
        SELECT
            point_sequence,
            latitude,
            longitude
        FROM sim_route_points
        WHERE route_id = :route_id
        ORDER BY point_sequence
    """)

    with get_engine().connect() as connection:
        route = connection.execute(
            route_query,
            {"route_id": route_id}
        ).mappings().first()

        points = connection.execute(
            points_query,
            {"route_id": route_id}
        ).mappings().all()

    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found"
        )

    return {
        "route_id": route["route_id"],
        "route_code": route["route_code"],
        "movement_type": route["movement_type"],
        "source": route["source_name"],
        "destination": route["destination_name"],
        "source_position": [
            float(route["source_lat"]),
            float(route["source_lon"])
        ],
        "destination_position": [
            float(route["destination_lat"]),
            float(route["destination_lon"])
        ],
        "distance_km": float(route["distance_km"]),
        "route_status": route["route_status"],
        "points": [
            [
                float(point["latitude"]),
                float(point["longitude"])
            ]
            for point in points
        ]
    }