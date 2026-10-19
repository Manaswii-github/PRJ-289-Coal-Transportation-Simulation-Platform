import { useEffect, useMemo, useState } from "react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    Tooltip,
    useMap
} from "react-leaflet";

import L from "leaflet";

import {
    getSimulationMovement,
    getSimulationRoute
} from "../services/simulationService";

import "leaflet/dist/leaflet.css";


const trainIcon = L.divIcon({
    className: "simulation-train-icon",
    html: "🚂",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
});


const truckIcon = L.divIcon({
    className: "simulation-truck-icon",
    html: "🚛",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
});


const sourceIcon = L.divIcon({
    className: "route-source-icon",
    html: "●",
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});


const destinationIcon = L.divIcon({
    className: "route-destination-icon",
    html: "◆",
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});


function FleetMapFitter({ positions }) {
    const map = useMap();
    const [fitted, setFitted] = useState(false);

    useEffect(() => {
        if (
            fitted ||
            !positions ||
            positions.length === 0
        ) {
            return;
        }

        const validPositions = positions.filter(
            (point) =>
                Number.isFinite(point[0]) &&
                Number.isFinite(point[1])
        );

        if (validPositions.length === 0) {
            return;
        }

        const bounds = L.latLngBounds(
            validPositions
        );

        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 7
        });

        setFitted(true);
    }, [map, positions, fitted]);

    return null;
}


function SelectedRouteFitter({ points }) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length < 2) {
            return;
        }

        const bounds = L.latLngBounds(points);

        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 10
        });
    }, [map, points]);

    return null;
}


function TrackingMap({
    replayState = null
}) {
    const [movementCode, setMovementCode] =
        useState("");

    const [searchCode, setSearchCode] =
        useState("");

    const [movement, setMovement] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [routesByMovement, setRoutesByMovement] =
        useState({});

    const [routeLoading, setRouteLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [focusMovement, setFocusMovement] =
        useState(false);


    const trains =
        Array.isArray(replayState?.trains)
            ? replayState.trains
            : [];

    const trucks =
        Array.isArray(replayState?.trucks)
            ? replayState.trucks
            : [];


    const allMovements = useMemo(
        () => [
            ...trains,
            ...trucks
        ],
        [trains, trucks]
    );


    const routeTargets = useMemo(() => {
        const targets = {};

        allMovements.forEach((item) => {
            const code = String(
                item.movement_code
            ).toUpperCase();

            const routeId =
                item.route_id ??
                item.routeId;

            if (code && routeId) {
                targets[code] = String(routeId);
            }
        });

        return targets;
    }, [allMovements]);


    const routeTargetsKey =
        Object.entries(routeTargets)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, routeId]) => `${code}:${routeId}`)
            .join("|");


    const selectedMovement =
        allMovements.find(
            (item) =>
                String(
                    item.movement_code
                ).toUpperCase() ===
                String(
                    movementCode
                ).toUpperCase()
        ) || null;


    const markerPositions = useMemo(
        () =>
            allMovements
                .map((item) => [
                    Number(item.latitude),
                    Number(item.longitude)
                ])
                .filter(
                    (point) =>
                        Number.isFinite(point[0]) &&
                        Number.isFinite(point[1])
                ),
        [allMovements]
    );


    const selectedType =
        String(
            selectedMovement?.movement_type ||
            selectedMovement?.mode ||
            ""
        ).toUpperCase();


    const isSelectedTruck =
        selectedType === "ROAD" ||
        selectedType === "TRUCK";


    useEffect(() => {
        if (!movementCode) {
            return;
        }

        const currentMovement =
            allMovements.find(
                (item) =>
                    String(
                        item.movement_code
                    ).toUpperCase() ===
                    String(
                        movementCode
                    ).toUpperCase()
            );

        if (currentMovement) {
            setMovement(currentMovement);
        }
    }, [movementCode, allMovements]);


    useEffect(() => {
        if (!movementCode) {
            return;
        }

        let cancelled = false;

        const loadMovementDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getSimulationMovement(
                        movementCode
                    );

                if (!cancelled) {
                    setMovement((current) => ({
                        ...(current || {}),
                        ...(data || {})
                    }));
                }
            } catch (err) {
                console.error(
                    "Failed to load movement:",
                    err
                );

                if (!cancelled) {
                    setError(
                        "Unable to load movement details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadMovementDetails();

        return () => {
            cancelled = true;
        };
    }, [movementCode]);


    const movementIsTruck =
        String(
            movement?.movement_type ||
            movement?.mode ||
            movement?.transport_mode ||
            selectedMovement?.movement_type ||
            ""
        ).toUpperCase() === "ROAD";


    useEffect(() => {
        let cancelled = false;

        const loadAllRoutes = async () => {
            if (allMovements.length === 0) {
                setRoutesByMovement({});
                return;
            }

            setRouteLoading(true);

            try {
                const uniqueRouteIds = [
                    ...new Set(
                        Object.values(routeTargets)
                    )
                ];

                const routeResults =
                    await Promise.all(
                        uniqueRouteIds.map(
                            async (routeId) => {
                                try {
                                    const routeData =
                                        await getSimulationRoute(
                                            routeId
                                        );

                                    const routePoints =
                                        routeData?.points ??
                                        routeData?.route_points ??
                                        routeData?.routePoints ??
                                        routeData;

                                    if (!Array.isArray(routePoints)) {
                                        return {
                                            routeId,
                                            points: []
                                        };
                                    }

                                    const points = routePoints
                                        .map((point) => {
                                            if (Array.isArray(point)) {
                                                return [
                                                    Number(point[0]),
                                                    Number(point[1])
                                                ];
                                            }

                                            return [
                                                Number(
                                                    point.latitude ??
                                                    point.lat
                                                ),
                                                Number(
                                                    point.longitude ??
                                                    point.lng ??
                                                    point.lon
                                                )
                                            ];
                                        })
                                        .filter(
                                            (point) =>
                                                Number.isFinite(point[0]) &&
                                                Number.isFinite(point[1])
                                        );

                                    return {
                                        routeId,
                                        points
                                    };
                                } catch (err) {
                                    console.error(
                                        `Failed to load route ${routeId}:`,
                                        err
                                    );

                                    return {
                                        routeId,
                                        points: []
                                    };
                                }
                            }
                        )
                    );

                if (cancelled) {
                    return;
                }

                const pointsByRouteId = {};

                routeResults.forEach((result) => {
                    pointsByRouteId[
                        String(result.routeId)
                    ] = result.points;
                });

                const routeMap = {};

                Object.entries(routeTargets).forEach(
                    ([movementKey, routeId]) => {
                        routeMap[movementKey] =
                            pointsByRouteId[
                                String(routeId)
                            ] || [];
                    }
                );

                setRoutesByMovement(routeMap);
            } finally {
                if (!cancelled) {
                    setRouteLoading(false);
                }
            }
        };

        loadAllRoutes();

        return () => {
            cancelled = true;
        };
    }, [routeTargetsKey]);


    const selectedRoute =
        routesByMovement[
            String(movementCode).toUpperCase()
        ] || [];

    // Prefer the exact endpoints of the selected route. If route geometry
    // is missing, use the source/destination coordinates returned by replay.py.
    const sourcePosition = useMemo(() => {
        if (selectedRoute.length > 0) {
            return selectedRoute[0];
        }

        const lat = Number(
            movement?.source_lat ?? selectedMovement?.source_lat
        );
        const lng = Number(
            movement?.source_lon ?? selectedMovement?.source_lon
        );

        return Number.isFinite(lat) && Number.isFinite(lng)
            ? [lat, lng]
            : null;
    }, [selectedRoute, movement, selectedMovement]);

    const destinationPosition = useMemo(() => {
        if (selectedRoute.length > 0) {
            return selectedRoute[selectedRoute.length - 1];
        }

        const lat = Number(
            movement?.destination_lat ?? selectedMovement?.destination_lat
        );
        const lng = Number(
            movement?.destination_lon ?? selectedMovement?.destination_lon
        );

        return Number.isFinite(lat) && Number.isFinite(lng)
            ? [lat, lng]
            : null;
    }, [selectedRoute, movement, selectedMovement]);


    const sourceName =
        movement?.source_name ??
        movement?.source ??
        movement?.origin ??
        selectedMovement?.source_name ??
        "-";


    const destinationName =
        movement?.destination_name ??
        movement?.destination ??
        selectedMovement?.destination_name ??
        "-";


    const submitSearch = (event) => {
        event.preventDefault();

        const value =
            searchCode
                .trim()
                .toUpperCase();

        if (!value) {
            return;
        }

        setError("");
        setMovementCode(value);
        setFocusMovement(true);
    };


    const clearSelection = () => {
        setMovementCode("");
        setSearchCode("");
        setMovement(null);
        setFocusMovement(false);
        setError("");
    };


    const displayMovement =
        selectedMovement || movement;


    const mapCenter =
        markerPositions.length > 0
            ? markerPositions[0]
            : [20.5937, 78.9629];


    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative"
            }}
        >

            {/* TRACKING SEARCH CONTROL */}
            <form
                onSubmit={submitSearch}
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    top: 12,
                    right: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#ffffff",
                    padding: 8,
                    borderRadius: 6,
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.18)"
                }}
            >

                <input
                    value={searchCode}
                    onChange={(event) =>
                        setSearchCode(
                            event.target.value
                        )
                    }
                    placeholder="Movement ID"
                    style={{
                        width: 155,
                        border:
                            "1px solid #ccc",
                        borderRadius: 4,
                        padding:
                            "7px 9px"
                    }}
                />

                <button
                    type="submit"
                    style={{
                        border: "none",
                        borderRadius: 4,
                        padding:
                            "7px 12px",
                        cursor: "pointer"
                    }}
                >
                    Track
                </button>

                {focusMovement && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        style={{
                            border:
                                "1px solid #ccc",
                            background:
                                "#ffffff",
                            borderRadius: 4,
                            padding:
                                "7px 10px",
                            cursor: "pointer"
                        }}
                    >
                        All
                    </button>
                )}

            </form>


            {/* STATUS */}
            {(loading || routeLoading) && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1000,
                        bottom: 12,
                        left: 12,
                        background: "#ffffff",
                        padding:
                            "7px 10px",
                        borderRadius: 5,
                        boxShadow:
                            "0 2px 8px rgba(0,0,0,0.15)",
                        fontSize: 12
                    }}
                >
                    Loading fleet routes...
                </div>
            )}


            {error && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1000,
                        bottom: 12,
                        left: 12,
                        background:
                            "#fff3f3",
                        color: "#b42318",
                        padding:
                            "8px 10px",
                        borderRadius: 5,
                        fontSize: 12
                    }}
                >
                    {error}
                </div>
            )}


            {/* FLEET COUNT */}
            <div
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    top: 12,
                    left: 55,
                    background:
                        "rgba(255,255,255,0.94)",
                    padding:
                        "7px 11px",
                    borderRadius: 5,
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.12)",
                    fontSize: 12,
                    fontWeight: 600
                }}
            >
                {trains.length} trains ·{" "}
                {trucks.length} trucks
            </div>


            <MapContainer
                center={mapCenter}
                zoom={6}
                scrollWheelZoom={true}
                style={{
                    width: "100%",
                    height: "100%"
                }}
            >

                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                {/* ALL CURRENT VEHICLES */}

                {allMovements.map(
                    (item) => {
                        const lat =
                            Number(
                                item.latitude
                            );

                        const lng =
                            Number(
                                item.longitude
                            );

                        if (
                            !Number.isFinite(
                                lat
                            ) ||
                            !Number.isFinite(
                                lng
                            )
                        ) {
                            return null;
                        }

                        const isTruck =
                            String(
                                item.movement_type
                            ).toUpperCase() ===
                            "ROAD";

                        const isSelected =
                            String(
                                item.movement_code
                            ).toUpperCase() ===
                            String(
                                movementCode
                            ).toUpperCase();

                        return (
                            <Marker
                                key={
                                    item.movement_code
                                }
                                position={[
                                    lat,
                                    lng
                                ]}
                                icon={
                                    isTruck
                                        ? truckIcon
                                        : trainIcon
                                }
                                eventHandlers={{
                                    click: () => {
                                        setMovementCode(
                                            item.movement_code
                                        );
                                        setSearchCode(
                                            item.movement_code
                                        );
                                        setMovement(
                                            item
                                        );
                                        setFocusMovement(
                                            true
                                        );
                                        setError("");
                                    }
                                }}
                            >

                                <Tooltip
                                    direction="top"
                                    offset={[0, -15]}
                                >
                                    <strong>{item.movement_code}</strong>
                                    <br />
                                    {item.replay_status ?? item.master_status ?? "-"}
                                    <br />
                                    <strong>ML-predicted delay:</strong>{" "}
                                    {item.predicted_delay_min != null
                                        ? `${Number(item.predicted_delay_min).toFixed(1)} min`
                                        : "N/A"}
                                    <br />
                                    <strong>Predicted ETA:</strong>{" "}
                                    {item.predicted_eta
                                        ? new Date(item.predicted_eta).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                          })
                                        : "N/A"}
                                </Tooltip>


                                <Popup>

                                    <div
                                        style={{
                                            minWidth: 220
                                        }}
                                    >

                                        <h3
                                            style={{
                                                marginTop: 0
                                            }}
                                        >
                                            {
                                                item.movement_code
                                            }
                                        </h3>

                                        <p>
                                            <strong>
                                                Mode:
                                            </strong>{" "}
                                            {isTruck
                                                ? "ROAD"
                                                : "RAIL"}
                                        </p>

                                        <p>
                                            <strong>
                                                Route:
                                            </strong>{" "}
                                            {
                                                item.source_name
                                            }
                                            {" → "}
                                            {
                                                item.destination_name
                                            }
                                        </p>

                                        <p>
                                            <strong>
                                                Status:
                                            </strong>{" "}
                                            {
                                                item.replay_status ??
                                                item.master_status ??
                                                "-"
                                            }
                                        </p>

                                        <p>
                                            <strong>
                                                Speed:
                                            </strong>{" "}
                                            {
                                                item.speed_kmph ??
                                                0
                                            } km/h
                                        </p>

                                        <p>
                                            <strong>Actual delay:</strong>{" "}
                                            {item.delay_min ?? 0} min
                                        </p>

                                        <p>
                                            <strong>ML-predicted delay:</strong>{" "}
                                            {item.predicted_delay_min != null
                                                ? `${Number(item.predicted_delay_min).toFixed(2)} min`
                                                : "Not available"}
                                        </p>

                                        <p>
                                            <strong>Predicted ETA:</strong>{" "}
                                            {item.predicted_eta
                                                ? new Date(item.predicted_eta).toLocaleString()
                                                : "Not available"}
                                        </p>

                                        <p>
                                            <strong>
                                                Distance left:
                                            </strong>{" "}
                                            {
                                                item.distance_remaining_km ??
                                                "-"
                                            } km
                                        </p>

                                        {!isTruck && (
                                            <>
                                                <p>
                                                    <strong>
                                                        Wagons:
                                                    </strong>{" "}
                                                    {
                                                        item.wagon_count ??
                                                        "-"
                                                    }
                                                </p>

                                                <p>
                                                    <strong>
                                                        Coal:
                                                    </strong>{" "}
                                                    {
                                                        item.tonnage ??
                                                        "-"
                                                    } t
                                                </p>
                                            </>
                                        )}

                                        {isTruck && (
                                            <p>
                                                <strong>
                                                    Load:
                                                </strong>{" "}
                                                {
                                                    item.tonnage ??
                                                    "-"
                                                } t
                                            </p>
                                        )}

                                    </div>

                                </Popup>

                            </Marker>
                        );
                    }
                )}


                {/* FLEET FIT */}

                {!focusMovement &&
                    markerPositions.length > 0 && (
                        <FleetMapFitter
                            positions={
                                markerPositions
                            }
                        />
                    )}


                {/* ALL MOVEMENT ROUTES */}

                {Object.entries(routesByMovement).map(
                    ([code, points]) => {
                        if (!points || points.length < 2) {
                            return null;
                        }

                        const isSelected =
                            String(code).toUpperCase() ===
                            String(movementCode).toUpperCase();

                        const routeMovement =
                            allMovements.find(
                                (item) =>
                                    String(item.movement_code).toUpperCase() ===
                                    String(code).toUpperCase()
                            );

                        const routeIsTruck =
                            String(
                                routeMovement?.movement_type ||
                                routeMovement?.mode ||
                                ""
                            ).toUpperCase() === "ROAD";

                        return (
                            <Polyline
                                key={`route-${code}`}
                                positions={points}
                                pathOptions={{
                                    color: isSelected
                                        ? "#111827"
                                        : routeIsTruck
                                            ? "#e67e22"
                                            : "#1769aa",
                                    weight: isSelected ? 7 : 3,
                                    opacity: isSelected ? 1 : 0.5
                                }}
                            />
                        );
                    }
                )}


                {/* SELECTED MOVEMENT FOCUS */}

                {focusMovement && selectedRoute.length >= 2 && (
                    <SelectedRouteFitter points={selectedRoute} />
                )}

                {/* SOURCE PIN: shown for the selected movement even when route
                    geometry is unavailable; hover over the pin for its name. */}
                {focusMovement && sourcePosition && (
                    <Marker
                        position={sourcePosition}
                        icon={sourceIcon}
                        zIndexOffset={1000}
                    >
                        <Tooltip direction="top" offset={[0, -8]}>
                            <strong>Source:</strong> {sourceName}
                        </Tooltip>
                        <Popup>
                            <strong>Source</strong>
                            <br />
                            {sourceName}
                        </Popup>
                    </Marker>
                )}

                {/* DESTINATION PIN: shown for the selected movement even when
                    route geometry is unavailable; hover over the pin for its name. */}
                {focusMovement && destinationPosition && (
                    <Marker
                        position={destinationPosition}
                        icon={destinationIcon}
                        zIndexOffset={1000}
                    >
                        <Tooltip direction="top" offset={[0, -8]}>
                            <strong>Destination:</strong> {destinationName}
                        </Tooltip>
                        <Popup>
                            <strong>Destination</strong>
                            <br />
                            {destinationName}
                        </Popup>
                    </Marker>
                )}

            </MapContainer>

        </div>
    );
}


export default TrackingMap;