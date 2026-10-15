from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database.connection import get_engine


router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)


def fetch_one(connection, query):
    result = connection.execute(text(query))
    return result.mappings().first()


def fetch_all(connection, query):
    result = connection.execute(text(query))
    return result.mappings().all()


@router.get("/summary")
def get_analytics_summary() -> Dict[str, Any]:

    try:
        with get_engine().connect() as connection:

            rail_summary = fetch_one(
                connection,
                """
                SELECT
                    COUNT(*) AS total_movements,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status IN (
                                    'IN_TRANSIT',
                                    'DELAYED',
                                    'STOPPED'
                                )
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS active_movements,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN actual_arrival IS NOT NULL
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS completed_movements,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status = 'DELAYED'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS delayed_movements,

                    COALESCE(
                        SUM(tonnage),
                        0
                    ) AS total_tonnage

                FROM sim_rail_movements
                """
            )

            truck_summary = fetch_one(
                connection,
                """
                SELECT
                    COUNT(*) AS total_movements,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status IN (
                                    'IN_TRANSIT',
                                    'DELAYED',
                                    'STOPPED',
                                    'LOADED'
                                )
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS active_movements,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN actual_arrival IS NOT NULL
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS completed_movements,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status = 'DELAYED'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS delayed_movements,

                    COALESCE(
                        SUM(load_t),
                        0
                    ) AS total_tonnage

                FROM sim_trucks
                """
            )

            rail_total = int(
                rail_summary["total_movements"] or 0
            )

            truck_total = int(
                truck_summary["total_movements"] or 0
            )

            rail_active = int(
                rail_summary["active_movements"] or 0
            )

            truck_active = int(
                truck_summary["active_movements"] or 0
            )

            rail_completed = int(
                rail_summary["completed_movements"] or 0
            )

            truck_completed = int(
                truck_summary["completed_movements"] or 0
            )

            rail_delayed = int(
                rail_summary["delayed_movements"] or 0
            )

            truck_delayed = int(
                truck_summary["delayed_movements"] or 0
            )

            rail_tonnage = float(
                rail_summary["total_tonnage"] or 0
            )

            truck_tonnage = float(
                truck_summary["total_tonnage"] or 0
            )

            total_movements = (
                rail_total + truck_total
            )

            active_movements = (
                rail_active + truck_active
            )

            completed_movements = (
                rail_completed + truck_completed
            )

            delayed_movements = (
                rail_delayed + truck_delayed
            )

            total_tonnage = (
                rail_tonnage + truck_tonnage
            )

            on_time_movements = (
                total_movements - delayed_movements
            )

            if total_movements > 0:
                on_time_percentage = round(
                    (
                        on_time_movements
                        / total_movements
                    ) * 100,
                    2
                )
            else:
                on_time_percentage = 0

            fleet_distribution = [
                {
                    "name": "Rail",
                    "value": rail_total
                },
                {
                    "name": "Road",
                    "value": truck_total
                }
            ]

            delay_buckets = fetch_all(
                connection,
                """
                SELECT
                    delay_bucket,
                    COUNT(*) AS movement_count

                FROM
                (
                    SELECT
                        CASE

                            WHEN TIMESTAMPDIFF(
                                MINUTE,
                                scheduled_departure,
                                actual_arrival
                            )
                            <=
                            (
                                CEIL(
                                    r.distance_km / 50
                                ) * 60
                            )
                            THEN 'ON TIME'

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    scheduled_departure,
                                    actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 50
                                    ) * 60
                                )
                                <= 15
                            THEN '1-15 MIN'

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    scheduled_departure,
                                    actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 50
                                    ) * 60
                                )
                                <= 30
                            THEN '16-30 MIN'

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    scheduled_departure,
                                    actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 50
                                    ) * 60
                                )
                                <= 60
                            THEN '31-60 MIN'

                            ELSE '60+ MIN'

                        END AS delay_bucket

                    FROM sim_rail_movements m

                    JOIN sim_routes r
                        ON r.route_id = m.route_id


                    UNION ALL


                    SELECT
                        CASE

                            WHEN TIMESTAMPDIFF(
                                MINUTE,
                                scheduled_departure,
                                actual_arrival
                            )
                            <=
                            (
                                CEIL(
                                    r.distance_km / 42
                                ) * 60
                            )
                            THEN 'ON TIME'

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    scheduled_departure,
                                    actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 42
                                    ) * 60
                                )
                                <= 15
                            THEN '1-15 MIN'

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    scheduled_departure,
                                    actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 42
                                    ) * 60
                                )
                                <= 30
                            THEN '16-30 MIN'

                            WHEN
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    scheduled_departure,
                                    actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 42
                                    ) * 60
                                )
                                <= 60
                            THEN '31-60 MIN'

                            ELSE '60+ MIN'

                        END AS delay_bucket

                    FROM sim_trucks m

                    JOIN sim_routes r
                        ON r.route_id = m.route_id

                ) AS combined

                GROUP BY delay_bucket

                ORDER BY
                    CASE delay_bucket
                        WHEN 'ON TIME' THEN 1
                        WHEN '1-15 MIN' THEN 2
                        WHEN '16-30 MIN' THEN 3
                        WHEN '31-60 MIN' THEN 4
                        WHEN '60+ MIN' THEN 5
                        ELSE 6
                    END
                """
            )

            daily_rows = fetch_all(
                connection,
                """
                SELECT
                    movement_date,
                    SUM(rail_count) AS rail_count,
                    SUM(truck_count) AS truck_count,
                    SUM(
                        rail_count + truck_count
                    ) AS total_count

                FROM
                (
                    SELECT
                        DATE(scheduled_departure)
                            AS movement_date,
                        COUNT(*) AS rail_count,
                        0 AS truck_count

                    FROM sim_rail_movements

                    GROUP BY
                        DATE(scheduled_departure)


                    UNION ALL


                    SELECT
                        DATE(scheduled_departure)
                            AS movement_date,
                        0 AS rail_count,
                        COUNT(*) AS truck_count

                    FROM sim_trucks

                    GROUP BY
                        DATE(scheduled_departure)

                ) AS daily_data

                GROUP BY movement_date

                ORDER BY movement_date
                """
            )

            rail_performance = fetch_one(
                connection,
                """
                SELECT

                    COALESCE(
                        AVG(
                            TIMESTAMPDIFF(
                                MINUTE,
                                m.scheduled_departure,
                                m.actual_arrival
                            )
                        ),
                        0
                    ) AS avg_transit_minutes,

                    COALESCE(
                        AVG(
                            GREATEST(
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    m.scheduled_departure,
                                    m.actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 50
                                    ) * 60
                                ),
                                0
                            )
                        ),
                        0
                    ) AS avg_delay_minutes,

                    COALESCE(
                        MAX(
                            GREATEST(
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    m.scheduled_departure,
                                    m.actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 50
                                    ) * 60
                                ),
                                0
                            )
                        ),
                        0
                    ) AS max_delay_minutes

                FROM sim_rail_movements m

                JOIN sim_routes r
                    ON r.route_id = m.route_id
                """
            )

            truck_performance = fetch_one(
                connection,
                """
                SELECT

                    COALESCE(
                        AVG(
                            TIMESTAMPDIFF(
                                MINUTE,
                                m.scheduled_departure,
                                m.actual_arrival
                            )
                        ),
                        0
                    ) AS avg_transit_minutes,

                    COALESCE(
                        AVG(
                            GREATEST(
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    m.scheduled_departure,
                                    m.actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 42
                                    ) * 60
                                ),
                                0
                            )
                        ),
                        0
                    ) AS avg_delay_minutes,

                    COALESCE(
                        MAX(
                            GREATEST(
                                TIMESTAMPDIFF(
                                    MINUTE,
                                    m.scheduled_departure,
                                    m.actual_arrival
                                )
                                -
                                (
                                    CEIL(
                                        r.distance_km / 42
                                    ) * 60
                                ),
                                0
                            )
                        ),
                        0
                    ) AS max_delay_minutes

                FROM sim_trucks m

                JOIN sim_routes r
                    ON r.route_id = m.route_id
                """
            )

            rail_avg_transit = float(
                rail_performance["avg_transit_minutes"] or 0
            )

            truck_avg_transit = float(
                truck_performance["avg_transit_minutes"] or 0
            )

            rail_avg_delay = float(
                rail_performance["avg_delay_minutes"] or 0
            )

            truck_avg_delay = float(
                truck_performance["avg_delay_minutes"] or 0
            )

            rail_max_delay = float(
                rail_performance["max_delay_minutes"] or 0
            )

            truck_max_delay = float(
                truck_performance["max_delay_minutes"] or 0
            )

            if completed_movements > 0:

                avg_transit_minutes = (
                    (
                        rail_avg_transit
                        * rail_completed
                    )
                    +
                    (
                        truck_avg_transit
                        * truck_completed
                    )
                ) / completed_movements

                avg_delay_minutes = (
                    (
                        rail_avg_delay
                        * rail_completed
                    )
                    +
                    (
                        truck_avg_delay
                        * truck_completed
                    )
                ) / completed_movements

            else:

                avg_transit_minutes = 0
                avg_delay_minutes = 0

            max_delay_minutes = max(
                rail_max_delay,
                truck_max_delay
            )

            corridor_rows = fetch_all(
                connection,
                """
                SELECT
                    source_name,
                    destination_name,
                    movement_type,
                    movement_count,
                    tonnage,
                    avg_delay_minutes

                FROM
                (
                    SELECT
                        m.source_name,
                        m.destination_name,
                        'RAIL' AS movement_type,

                        COUNT(*) AS movement_count,

                        COALESCE(
                            SUM(m.tonnage),
                            0
                        ) AS tonnage,

                        COALESCE(
                            AVG(
                                GREATEST(
                                    TIMESTAMPDIFF(
                                        MINUTE,
                                        m.scheduled_departure,
                                        m.actual_arrival
                                    )
                                    -
                                    (
                                        CEIL(
                                            r.distance_km / 50
                                        ) * 60
                                    ),
                                    0
                                )
                            ),
                            0
                        ) AS avg_delay_minutes

                    FROM sim_rail_movements m

                    JOIN sim_routes r
                        ON r.route_id = m.route_id

                    GROUP BY
                        m.source_name,
                        m.destination_name


                    UNION ALL


                    SELECT
                        m.source_name,
                        m.destination_name,
                        'ROAD' AS movement_type,

                        COUNT(*) AS movement_count,

                        COALESCE(
                            SUM(m.load_t),
                            0
                        ) AS tonnage,

                        COALESCE(
                            AVG(
                                GREATEST(
                                    TIMESTAMPDIFF(
                                        MINUTE,
                                        m.scheduled_departure,
                                        m.actual_arrival
                                    )
                                    -
                                    (
                                        CEIL(
                                            r.distance_km / 42
                                        ) * 60
                                    ),
                                    0
                                )
                            ),
                            0
                        ) AS avg_delay_minutes

                    FROM sim_trucks m

                    JOIN sim_routes r
                        ON r.route_id = m.route_id

                    GROUP BY
                        m.source_name,
                        m.destination_name

                ) AS corridors

                ORDER BY
                    movement_count DESC
                """
            )

            return {

                "mode":
                    "SIMULATION / HISTORICAL REPLAY",

                "summary": {

                    "total_movements":
                        total_movements,

                    "active_movements":
                        active_movements,

                    "completed_movements":
                        completed_movements,

                    "delayed_movements":
                        delayed_movements,

                    "total_tonnage":
                        round(
                            total_tonnage,
                            2
                        ),

                    "on_time_percentage":
                        on_time_percentage
                },

                "fleet_distribution":
                    fleet_distribution,

                "delay_buckets": [
                    {
                        "name":
                            str(
                                row[
                                    "delay_bucket"
                                ]
                            ),

                        "value":
                            int(
                                row[
                                    "movement_count"
                                ] or 0
                            )
                    }

                    for row in delay_buckets
                ],

                "performance": {

                    "avg_transit_minutes":
                        round(
                            avg_transit_minutes,
                            2
                        ),

                    "avg_delay_minutes":
                        round(
                            avg_delay_minutes,
                            2
                        ),

                    "max_delay_minutes":
                        round(
                            max_delay_minutes,
                            2
                        )
                },

                "routes": [

                    {
                        "source":
                            row["source_name"],

                        "destination":
                            row["destination_name"],

                        "mode":
                            row["movement_type"],

                        "movement_count":
                            int(
                                row[
                                    "movement_count"
                                ] or 0
                            ),

                        "tonnage":
                            round(
                                float(
                                    row["tonnage"] or 0
                                ),
                                2
                            ),

                        "avg_delay_minutes":
                            round(
                                float(
                                    row[
                                        "avg_delay_minutes"
                                    ] or 0
                                ),
                                2
                            )
                    }

                    for row in corridor_rows
                ],

                "daily": [

                    {
                        "date":
                            str(
                                row[
                                    "movement_date"
                                ]
                            ),

                        "rail":
                            int(
                                row["rail_count"] or 0
                            ),

                        "truck":
                            int(
                                row["truck_count"] or 0
                            ),

                        "total":
                            int(
                                row["total_count"] or 0
                            )
                    }

                    for row in daily_rows
                ]
            }

    except HTTPException:
        raise
    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Analytics query failed: {exc}"
        )