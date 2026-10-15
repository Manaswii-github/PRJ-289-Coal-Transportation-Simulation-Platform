import { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    Tooltip,
    useMap,
} from "react-leaflet";
import L from "leaflet";

import {
    getSimulationMovement,
    getSimulationRoute,
} from "../services/simulationService";

import "leaflet/dist/leaflet.css";


const trainIcon = new L.DivIcon({
    className: "simulation-train-icon",
    html: "🚂",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

const truckIcon = new L.DivIcon({
    className: "simulation-truck-icon",
    html: "🚚",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

const sourceIcon = new L.DivIcon({
    className: "route-source-icon",
    html: "●",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const destinationIcon = new L.DivIcon({
    className: "route-destination-icon",
    html: "◆",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});


function fitToPoints(map, points, maxZoom = 8) {
    if (!points || points.length === 0) {
        return;
    }

    const valid = points.filter(
        (point) =>
            Array.isArray(point) &&
            Number.isFinite(Number(point[0])) &&
            Number.isFinite(Number(point[1]))
    );

    if (valid.length === 0) {
        return;
    }

    const bounds = L.latLngBounds(valid);

    if (bounds.isValid()) {
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom,
            animate: true,
        });
    }
}


function FleetFitter({ movements, selectedMovementCode }) {
    const map = useMap();
    const hasFitted = useRef(false);

    useEffect(() => {
        if (
            hasFitted.current ||
            selectedMovementCode ||
            !movements ||
            movements.length === 0
        ) {
            return;
        }

        const points = movements
            .map((item) => [
                Number(item.latitude),
                Number(item.longitude),
            ])
            .filter(
                (point) =>
                    Number.isFinite(point[0]) &&
                    Number.isFinite(point[1])
            );

        if (points.length === 0) {
            return;
        }

        fitToPoints(map, points, 7);
        hasFitted.current = true;
    }, [map, movements, selectedMovementCode]);

    return null;
}


function SelectedFitter({ points, active }) {
    const map = useMap();
    const lastFocusKey = useRef("");

    useEffect(() => {
        if (!active || points.length < 2) {
            return;
        }

        const focusKey = points
            .map(
                (point) =>
                    `${point[0]},${point[1]}`
            )
            .join("|");

        if (lastFocusKey.current === focusKey) {
            return;
        }

        lastFocusKey.current = focusKey;
        fitToPoints(map, points, 10);
    }, [map, points, active]);

    return null;
}


function getMovementCode(item) {
    return String(
        item?.movement_code ??
        item?.movementCode ??
        ""
    ).toUpperCase();
}


function getRouteId(item) {
    return item?.route_id ?? item?.routeId ?? null;
}


function getPosition(item) {
    const lat = Number(
        item?.latitude ??
        item?.current_latitude ??
        item?.lat
    );

    const lng = Number(
        item?.longitude ??
        item?.current_longitude ??
        item?.lng ??
        item?.lon
    );

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {
        return null;
    }

    return [lat, lng];
}


function getSource(item) {
    const lat = Number(item?.source_lat);
    const lng = Number(item?.source_lon);

    if (
        Number.isFinite(lat) &&
        Number.isFinite(lng)
    ) {
        return [lat, lng];
    }

    return null;
}


function getDestination(item) {
    const lat = Number(item?.destination_lat);
    const lng = Number(item?.destination_lon);

    if (
        Number.isFinite(lat) &&
        Number.isFinite(lng)
    ) {
        return [lat, lng];
    }

    return null;
}


function routePoints(route) {
    const raw =
        route?.points ??
        route?.route_points ??
        route?.routePoints ??
        route ??
        [];

    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .map((point) => {
            if (Array.isArray(point)) {
                return [
                    Number(point[0]),
                    Number(point[1]),
                ];
            }

            return [
                Number(
                    point?.latitude ??
                    point?.lat
                ),
                Number(
                    point?.longitude ??
                    point?.lng ??
                    point?.lon
                ),
            ];
        })
        .filter(
            (point) =>
                Number.isFinite(point[0]) &&
                Number.isFinite(point[1])
        );
}


export default function TrackingMap({
    replayState = null,
    simulationState = null,
    onMovementSelect,
    selectedMovementCode,
}) {
    const state = replayState ?? simulationState;

    const trains = Array.isArray(state?.trains)
        ? state.trains
        : [];

    const trucks = Array.isArray(state?.trucks)
        ? state.trucks
        : [];

    const allMovements = useMemo(
        () => [...trains, ...trucks],
        [trains, trucks]
    );

    const selectedCode = String(
        selectedMovementCode ?? ""
    ).trim().toUpperCase();

    const [searchCode, setSearchCode] =
        useState(selectedCode);

    const [movementDetails, setMovementDetails] =
        useState(null);

    const [routeCache, setRouteCache] =
        useState({});

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const selectedFromState = useMemo(
        () =>
            allMovements.find(
                (item) =>
                    getMovementCode(item) ===
                    selectedCode
            ) ?? null,
        [allMovements, selectedCode]
    );

    const selectedMovement =
        movementDetails ??
        selectedFromState;

    useEffect(() => {
        if (!selectedCode) {
            setMovementDetails(null);
            return;
        }

        const fromState = allMovements.find(
            (item) =>
                getMovementCode(item) ===
                selectedCode
        );

        if (fromState) {
            setMovementDetails(fromState);
            return;
        }

        let cancelled = false;

        setLoading(true);
        setError("");

        getSimulationMovement(selectedCode)
            .then((data) => {
                if (!cancelled) {
                    setMovementDetails(
                        data?.movement ??
                        data ??
                        null
                    );
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.detail ??
                        "Movement not found."
                    );
                    setMovementDetails(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [selectedCode, allMovements]);

    useEffect(() => {
        let cancelled = false;

        const ids = [
            ...new Set(
                allMovements
                    .map(getRouteId)
                    .filter(
                        (id) =>
                            id !== null &&
                            id !== undefined
                    )
                    .map(String)
            ),
        ];

        if (selectedMovement) {
            const selectedRouteId =
                getRouteId(selectedMovement);

            if (
                selectedRouteId !== null &&
                selectedRouteId !== undefined
            ) {
                ids.push(
                    String(selectedRouteId)
                );
            }
        }

        const uniqueIds = [
            ...new Set(ids),
        ];

        const missing = uniqueIds.filter(
            (id) => !routeCache[id]
        );

        if (missing.length === 0) {
            return;
        }

        Promise.all(
            missing.map(async (id) => {
                try {
                    const data =
                        await getSimulationRoute(
                            id
                        );

                    return [
                        id,
                        data?.points ??
                        data?.route_points ??
                        data?.routePoints ??
                        data ??
                        [],
                    ];
                } catch {
                    return [id, []];
                }
            })
        ).then((entries) => {
            if (cancelled) {
                return;
            }

            setRouteCache((current) => {
                const next = {
                    ...current,
                };

                entries.forEach(
                    ([id, points]) => {
                        next[id] = routePoints(
                            points
                        );
                    }
                );

                return next;
            });
        });

        return () => {
            cancelled = true;
        };
    }, [allMovements, selectedMovement]);

    const selectedRouteId =
        getRouteId(selectedMovement);

    const selectedRoute = useMemo(() => {
        if (
            selectedRouteId === null ||
            selectedRouteId === undefined
        ) {
            return [];
        }

        return (
            routeCache[
                String(selectedRouteId)
            ] ?? []
        );
    }, [routeCache, selectedRouteId]);

    const selectedSource =
        getSource(selectedMovement) ??
        selectedRoute[0] ??
        null;

    const selectedDestination =
        getDestination(selectedMovement) ??
        selectedRoute[
            selectedRoute.length - 1
        ] ??
        null;

    const dailyRoutes = useMemo(() => {
        const result = [];
        const seen = new Set();

        allMovements.forEach((movement) => {
            const routeId = getRouteId(movement);

            if (
                routeId === null ||
                routeId === undefined
            ) {
                return;
            }

            const key = String(routeId);

            if (seen.has(key)) {
                return;
            }

            seen.add(key);

            let points =
                routeCache[key] ?? [];

            if (points.length < 2) {
                const source =
                    getSource(movement);
                const destination =
                    getDestination(movement);

                if (source && destination) {
                    points = [
                        source,
                        destination,
                    ];
                }
            }

            if (points.length >= 2) {
                result.push({
                    routeId: key,
                    points,
                });
            }
        });

        return result;
    }, [allMovements, routeCache]);

    const handleSearch = (event) => {
        event.preventDefault();

        const code =
            searchCode
                .trim()
                .toUpperCase();

        if (!code) {
            return;
        }

        const exists =
            allMovements.some(
                (item) =>
                    getMovementCode(item) ===
                    code
            );

        if (!exists) {
            setError(
                `${code} has no movement on the selected simulator day.`
            );
            return;
        }

        setError("");

        if (onMovementSelect) {
            onMovementSelect(code);
        }
    };

    const clearSelection = () => {
        setSearchCode("");

        if (onMovementSelect) {
            onMovementSelect("");
        }

        setMovementDetails(null);
        setError("");
    };

    const mapCenter =
        getPosition(allMovements[0]) ??
        [20.5937, 78.9629];

    const simulatorTime =
        state?.simulation_time ??
        state?.requested_timestamp ??
        null;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 620,
                position: "relative",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    top: 12,
                    right: 12,
                    background: "white",
                    padding: 9,
                    borderRadius: 7,
                    boxShadow:
                        "0 2px 12px rgba(0,0,0,.18)",
                }}
            >
                <form
                    onSubmit={handleSearch}
                    style={{
                        display: "flex",
                        gap: 6,
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
                            padding: "7px 9px",
                            border:
                                "1px solid #d1d5db",
                            borderRadius: 5,
                        }}
                    />

                    <button
                        type="submit"
                        style={{
                            border: 0,
                            borderRadius: 5,
                            padding:
                                "7px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Focus
                    </button>

                    {selectedCode && (
                        <button
                            type="button"
                            onClick={
                                clearSelection
                            }
                            style={{
                                border:
                                    "1px solid #d1d5db",
                                background:
                                    "white",
                                borderRadius: 5,
                                padding:
                                    "7px 10px",
                                cursor: "pointer",
                            }}
                        >
                            All
                        </button>
                    )}
                </form>

                <div
                    style={{
                        marginTop: 7,
                        fontSize: 11,
                        color: "#4b5563",
                    }}
                >
                    {simulatorTime
                        ? `Simulator: ${String(
                              simulatorTime
                          ).replace(
                              "T",
                              " "
                          )}`
                        : "Simulation time unavailable"}
                </div>

                {loading && (
                    <div
                        style={{
                            marginTop: 5,
                            fontSize: 11,
                            color: "#2563eb",
                        }}
                    >
                        Loading movement...
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            marginTop: 6,
                            color: "#b91c1c",
                            fontSize: 11,
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    top: 12,
                    left: 55,
                    background:
                        "rgba(255,255,255,.94)",
                    padding: "7px 10px",
                    borderRadius: 5,
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,.12)",
                    fontSize: 12,
                    fontWeight: 600,
                }}
            >
                {trains.length} trains ·{" "}
                {trucks.length} trucks
            </div>

            <MapContainer
                center={mapCenter}
                zoom={5}
                scrollWheelZoom
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 620,
                }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FleetFitter
                    movements={allMovements}
                    selectedMovementCode={
                        selectedCode
                    }
                />

                <SelectedFitter
                    points={selectedRoute}
                    active={
                        Boolean(selectedCode) &&
                        selectedRoute.length >= 2
                    }
                />

                {/* EVERY DAILY ROUTE */}
                {dailyRoutes.map((route) => {
                    const selected =
                        selectedRouteId !==
                            null &&
                        selectedRouteId !==
                            undefined &&
                        String(
                            selectedRouteId
                        ) === route.routeId;

                    return (
                        <Polyline
                            key={`daily-route-${route.routeId}`}
                            positions={
                                route.points
                            }
                            pathOptions={{
                                color: selected
                                    ? "#64748b"
                                    : "#6b7280",
                                weight: selected
                                    ? 3
                                    : 2,
                                opacity: selected
                                    ? 0.30
                                    : 0.18,
                                dashArray:
                                    "6 8",
                            }}
                        />
                    );
                })}

                {/* SELECTED MOVEMENT PATH */}
                {selectedCode &&
                    selectedRoute.length >= 2 && (
                        <Polyline
                            positions={
                                selectedRoute
                            }
                            pathOptions={{
                                color: "#2563eb",
                                weight: 7,
                                opacity: 0.95,
                            }}
                        />
                    )}

                {/* SELECTED SOURCE */}
                {selectedCode &&
                    selectedSource && (
                        <Marker
                            position={
                                selectedSource
                            }
                            icon={sourceIcon}
                        >
                            <Tooltip>
                                Source
                            </Tooltip>
                            <Popup>
                                <strong>
                                    Source
                                </strong>
                                <br />
                                {
                                    selectedMovement?.source_name
                                }
                            </Popup>
                        </Marker>
                    )}

                {/* SELECTED DESTINATION */}
                {selectedCode &&
                    selectedDestination && (
                        <Marker
                            position={
                                selectedDestination
                            }
                            icon={
                                destinationIcon
                            }
                        >
                            <Tooltip>
                                Destination
                            </Tooltip>
                            <Popup>
                                <strong>
                                    Destination
                                </strong>
                                <br />
                                {
                                    selectedMovement?.destination_name
                                }
                            </Popup>
                        </Marker>
                    )}

                {/* EVERY DAILY VEHICLE */}
                {allMovements.map(
                    (movement) => {
                        const position =
                            getPosition(
                                movement
                            );

                        if (!position) {
                            return null;
                        }

                        const code =
                            getMovementCode(
                                movement
                            );

                        const isTruck =
                            String(
                                movement?.movement_type
                            ).toUpperCase() ===
                                "ROAD" ||
                            code.startsWith(
                                "SIM-T"
                            );

                        const selected =
                            code ===
                            selectedCode;

                        return (
                            <Marker
                                key={code}
                                position={
                                    position
                                }
                                icon={
                                    isTruck
                                        ? truckIcon
                                        : trainIcon
                                }
                                zIndexOffset={
                                    selected
                                        ? 1000
                                        : 0
                                }
                                eventHandlers={{
                                    click: () => {
                                        setSearchCode(
                                            code
                                        );

                                        if (
                                            onMovementSelect
                                        ) {
                                            onMovementSelect(
                                                code
                                            );
                                        }
                                    },
                                }}
                            >
                                <Tooltip>
                                    <strong>
                                        {code}
                                    </strong>
                                    <br />
                                    {
                                        movement?.source_name
                                    }{" "}
                                    →{" "}
                                    {
                                        movement?.destination_name
                                    }
                                </Tooltip>

                                <Popup>
                                    <strong>
                                        {code}
                                    </strong>

                                    <div>
                                        {
                                            movement?.source_name
                                        }{" "}
                                        →{" "}
                                        {
                                            movement?.destination_name
                                        }
                                    </div>

                                    <div>
                                        Status:{" "}
                                        {
                                            movement?.replay_status ??
                                            "-"
                                        }
                                    </div>

                                    <div>
                                        Speed:{" "}
                                        {
                                            movement?.speed_kmph ??
                                            0
                                        } km/h
                                    </div>

                                    <div>
                                        Telemetry:{" "}
                                        {
                                            movement?.nearest_telemetry_timestamp ??
                                            movement?.telemetry_time ??
                                            "-"
                                        }
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                )}
            </MapContainer>
        </div>
    );
}
