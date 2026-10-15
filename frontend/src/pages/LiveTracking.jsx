import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import TrackingMap from "../components/TrackingMap";

import {
    getSimulationRange,
    getSimulationState
} from "../services/simulationService";


function formatDisplayDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const value =
        timestamp.replace(
            "T",
            " "
        );

    const date =
        value.split(" ")[0];

    const time =
        value.split(" ")[1] || "";

    const [
        year,
        month,
        day
    ] = date.split("-");

    return `${day}-${month}-${year} ${time.slice(
        0,
        8
    )}`;
}


function buildTimestamp(
    date,
    time
) {

    if (!date || !time) {
        return null;
    }

    return `${date}T${time}:00`;
}


function LiveTracking() {

    const [range, setRange] =
        useState({
            min_time: null,
            max_time: null
        });


    const [simulationDate, setSimulationDate] =
        useState("");


    const [simulationTime, setSimulationTime] =
        useState("");


    const [replayTimestamp, setReplayTimestamp] =
        useState(null);


    const [simulationState, setSimulationState] =
        useState(null);


    const [playing, setPlaying] =
        useState(false);


    const [speed, setSpeed] =
        useState(60);


    const [loading, setLoading] =
        useState(true);


    const [stateLoading, setStateLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [lastUpdate, setLastUpdate] =
        useState(null);


    const trains =
        simulationState?.trains || [];


    const trucks =
        simulationState?.trucks || [];


    const totalVehicles =
        trains.length +
        trucks.length;


    const delayedVehicles =
        [
            ...trains,
            ...trucks
        ].filter(
            (movement) =>
                movement.replay_status ===
                    "DELAYED" ||
                Number(
                    movement.delay_min || 0
                ) > 0
        ).length;


    const currentTimestamp =
        replayTimestamp;


    const currentDisplay =
        formatDisplayDate(
            currentTimestamp
        );


    const minTimestamp =
        range.min_time
            ? range.min_time.slice(
                0,
                16
            )
            : null;


    const maxTimestamp =
        range.max_time
            ? range.max_time.slice(
                0,
                16
            )
            : null;


    const loadState = async (
        timestamp
    ) => {

        if (!timestamp) {
            return;
        }

        try {

            setStateLoading(true);
            setError("");

            const state =
                await getSimulationState(
                    timestamp
                );

            setSimulationState(
                state
            );

            setReplayTimestamp(
                state.simulation_time
            );

            setLastUpdate(
                new Date()
            );

        } catch (err) {

            console.error(
                "Failed to load simulation state:",
                err
            );

            setError(
                "Unable to load replay state."
            );

        } finally {

            setStateLoading(false);

        }
    };


    useEffect(() => {

        const loadRange = async () => {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getSimulationRange();

                setRange(
                    data
                );


                if (data.min_time) {

                    const initial =
                        data.min_time.slice(
                            0,
                            16
                        );

                    setSimulationDate(
                        initial.slice(
                            0,
                            10
                        )
                    );

                    setSimulationTime(
                        initial.slice(
                            11,
                            16
                        )
                    );

                    await loadState(
                        `${initial}:00`
                    );
                }

            } catch (err) {

                console.error(
                    "Failed to load simulation range:",
                    err
                );

                setError(
                    "Unable to load simulation replay range."
                );

            } finally {

                setLoading(false);

            }

        };


        loadRange();

    }, []);


    const applyTime = async () => {

        const timestamp =
            buildTimestamp(
                simulationDate,
                simulationTime
            );

        if (!timestamp) {
            return;
        }

        setPlaying(false);

        await loadState(
            timestamp
        );
    };


    useEffect(() => {

        if (!playing || !replayTimestamp) {
            return;
        }


        const addSimulationMinutes = (
            timestamp,
            minutes
        ) => {
            const [datePart, timePart] =
                timestamp.split("T");

            const [year, month, day] =
                datePart.split("-").map(Number);

            const [hour, minute, second] =
                timePart.split(":").map(Number);

            const base =
                Date.UTC(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    second || 0
                );

            const next =
                new Date(
                    base +
                    minutes * 60 * 1000
                );

            const pad = (value) =>
                String(value).padStart(2, "0");

            return `${next.getUTCFullYear()}-${pad(
                next.getUTCMonth() + 1
            )}-${pad(
                next.getUTCDate()
            )}T${pad(
                next.getUTCHours()
            )}:${pad(
                next.getUTCMinutes()
            )}:${pad(
                next.getUTCSeconds()
            )}`;
        };


        const timer =
            setInterval(
                async () => {

                    const nextTimestamp =
                        addSimulationMinutes(
                            replayTimestamp,
                            speed
                        );


                    const maxTimestamp =
                        range.max_time
                            ? range.max_time
                                .replace(" ", "T")
                                .slice(0, 19)
                            : null;


                    if (
                        maxTimestamp &&
                        nextTimestamp >
                            maxTimestamp
                    ) {
                        setPlaying(false);
                        return;
                    }


                    await loadState(
                        nextTimestamp
                    );


                    setSimulationDate(
                        nextTimestamp.slice(
                            0,
                            10
                        )
                    );


                    setSimulationTime(
                        nextTimestamp.slice(
                            11,
                            16
                        )
                    );

                },
                1000
            );


        return () => {
            clearInterval(
                timer
            );
        };

    }, [
        playing,
        replayTimestamp,
        speed,
        range.max_time
    ]);


    const togglePlayback = () => {

        if (!replayTimestamp) {
            return;
        }

        setPlaying(
            (current) =>
                !current
        );
    };


    const jumpToStart = async () => {

        if (!range.min_time) {
            return;
        }

        const timestamp =
            range.min_time.slice(
                0,
                19
            );

        setPlaying(false);

        setSimulationDate(
            timestamp.slice(
                0,
                10
            )
        );

        setSimulationTime(
            timestamp.slice(
                11,
                16
            )
        );

        await loadState(
            timestamp
        );
    };


    const jumpToEnd = async () => {

        if (!range.max_time) {
            return;
        }

        const timestamp =
            range.max_time.slice(
                0,
                19
            );

        setPlaying(false);

        setSimulationDate(
            timestamp.slice(
                0,
                10
            )
        );

        setSimulationTime(
            timestamp.slice(
                11,
                16
            )
        );

        await loadState(
            timestamp
        );
    };


    const replayStatus =
        useMemo(
            () => {

                if (playing) {
                    return "PLAYING";
                }

                return "PAUSED";

            },
            [playing]
        );


    return (
        <DashboardLayout>

            <main className="page-container">

                <div
                    className="dashboard-hero"
                >

                    <div>

                        <span className="eyebrow">
                            OPERATIONS / HISTORICAL REPLAY
                        </span>

                        <h1>
                            Live Tracking
                            <span>.</span>
                        </h1>

                        <p>
                            Replay simulated rail and
                            road movements from the
                            selected date and time.
                        </p>

                    </div>


                    <div className="hero-status">

                        <span className="live-dot"></span>

                        <div>

                            <strong>
                                HISTORICAL REPLAY
                            </strong>

                            <small>
                                Database-driven simulation
                            </small>

                        </div>

                    </div>

                </div>


                {error && (

                    <div
                        className="dashboard-error"
                    >
                        {error}
                    </div>

                )}


                <div
                    className="content-card"
                    style={{
                        marginBottom: 16
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 14,
                            flexWrap: "wrap"
                        }}
                    >

                        <div>

                            <label
                                style={{
                                    display:
                                        "block",
                                    marginBottom:
                                        6,
                                    fontSize:
                                        12,
                                    fontWeight:
                                        600
                                }}
                            >
                                SIMULATION DATE
                            </label>

                            <input
                                type="date"
                                value={
                                    simulationDate
                                }
                                min={
                                    minTimestamp
                                        ? minTimestamp.slice(
                                            0,
                                            10
                                        )
                                        : undefined
                                }
                                max={
                                    maxTimestamp
                                        ? maxTimestamp.slice(
                                            0,
                                            10
                                        )
                                        : undefined
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSimulationDate(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                style={{
                                    padding:
                                        "8px 10px",
                                    border:
                                        "1px solid #ccc",
                                    borderRadius:
                                        4
                                }}
                            />

                        </div>


                        <div>

                            <label
                                style={{
                                    display:
                                        "block",
                                    marginBottom:
                                        6,
                                    fontSize:
                                        12,
                                    fontWeight:
                                        600
                                }}
                            >
                                SIMULATION TIME
                            </label>

                            <input
                                type="time"
                                value={
                                    simulationTime
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSimulationTime(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                style={{
                                    padding:
                                        "8px 10px",
                                    border:
                                        "1px solid #ccc",
                                    borderRadius:
                                        4
                                }}
                            />

                        </div>


                        <button
                            onClick={
                                applyTime
                            }
                            disabled={
                                stateLoading
                            }
                            style={{
                                padding:
                                    "9px 18px",
                                border: "none",
                                borderRadius:
                                    4,
                                cursor:
                                    "pointer",
                                fontWeight:
                                    600
                            }}
                        >
                            {stateLoading
                                ? "Loading..."
                                : "Set Time"}
                        </button>


                        <button
                            onClick={
                                togglePlayback
                            }
                            disabled={
                                !replayTimestamp
                            }
                            style={{
                                padding:
                                    "9px 18px",
                                border: "none",
                                borderRadius:
                                    4,
                                cursor:
                                    "pointer",
                                fontWeight:
                                    600
                            }}
                        >
                            {playing
                                ? "Pause"
                                : "Play"}
                        </button>


                        <select
                            value={
                                speed
                            }
                            onChange={(
                                event
                            ) =>
                                setSpeed(
                                    Number(
                                        event
                                            .target
                                            .value
                                    )
                                )
                            }
                            style={{
                                padding:
                                    "9px 12px",
                                border:
                                    "1px solid #ccc",
                                borderRadius:
                                    4
                            }}
                        >

                            <option value={1}>
                                1x
                            </option>

                            <option value={10}>
                                10x
                            </option>

                            <option value={60}>
                                60x
                            </option>

                            <option value={300}>
                                300x
                            </option>

                        </select>


                        <button
                            onClick={
                                jumpToStart
                            }
                            style={{
                                padding:
                                    "9px 12px",
                                border:
                                    "1px solid #ccc",
                                background:
                                    "#fff",
                                borderRadius:
                                    4,
                                cursor:
                                    "pointer"
                            }}
                        >
                            Start
                        </button>


                        <button
                            onClick={
                                jumpToEnd
                            }
                            style={{
                                padding:
                                    "9px 12px",
                                border:
                                    "1px solid #ccc",
                                background:
                                    "#fff",
                                borderRadius:
                                    4,
                                cursor:
                                    "pointer"
                            }}
                        >
                            End
                        </button>

                    </div>


                    <div
                        style={{
                            marginTop: 16,
                            display:
                                "flex",
                            gap: 24,
                            flexWrap:
                                "wrap",
                            alignItems:
                                "center"
                        }}
                    >

                        <strong>
                            Replay:
                            {" "}
                            {currentDisplay}
                        </strong>


                        <span>
                            Status:
                            {" "}
                            {replayStatus}
                        </span>


                        <span>
                            Speed:
                            {" "}
                            {speed}x
                        </span>


                        <span>
                            {totalVehicles}
                            {" "}vehicles
                        </span>


                        <span>
                            {delayedVehicles}
                            {" "}delayed
                        </span>

                    </div>

                </div>


                <div
                    className="content-card"
                    style={{
                        padding: 0,
                        overflow:
                            "hidden"
                    }}
                >

                    <div
                        style={{
                            height:
                                "calc(100vh - 310px)",
                            minHeight:
                                600
                        }}
                    >

                        <TrackingMap
                            replayState={
                                simulationState
                            }
                        />

                    </div>

                </div>


                <div
                    className="content-card"
                    style={{
                        marginTop: 16
                    }}
                >

                    <div
                        className="content-card-header"
                    >

                        <div>

                            <span className="section-kicker">
                                REPLAY FLEET
                            </span>

                            <h2>
                                Current movements
                            </h2>

                        </div>

                        <span>
                            {trains.length}
                            {" "}trains ·{" "}
                            {trucks.length}
                            {" "}trucks
                        </span>

                    </div>


                    <div
                        className="rake-table-wrapper"
                    >

                        <table
                            className="rake-table"
                        >

                            <thead>

                                <tr>

                                    <th>
                                        Movement
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        Route
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Speed
                                    </th>

                                    <th>
                                        Delay
                                    </th>

                                    <th>
                                        Distance Left
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {[
                                    ...trains,
                                    ...trucks
                                ].map(
                                    (movement) => (

                                        <tr
                                            key={
                                                movement.movement_code
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        movement.movement_code
                                                    }
                                                </strong>

                                            </td>


                                            <td>
                                                {
                                                    movement.movement_type ===
                                                    "ROAD"
                                                        ? "Road"
                                                        : "Rail"
                                                }
                                            </td>


                                            <td>
                                                {
                                                    movement.source_name
                                                }
                                                {" → "}
                                                {
                                                    movement.destination_name
                                                }
                                            </td>


                                            <td>

                                                <span
                                                    className={`rake-status ${
                                                        (
                                                            movement.replay_status ||
                                                            "unknown"
                                                        ).toLowerCase()
                                                    }`}
                                                >
                                                    {
                                                        movement.replay_status ||
                                                        "-"
                                                    }
                                                </span>

                                            </td>


                                            <td>
                                                {
                                                    movement.speed_kmph ??
                                                    0
                                                }{" "}
                                                km/h
                                            </td>


                                            <td>
                                                {
                                                    movement.delay_min ??
                                                    0
                                                }{" "}
                                                min
                                            </td>


                                            <td>
                                                {
                                                    movement.distance_remaining_km ??
                                                    "-"
                                                }{" "}
                                                km
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </main>

        </DashboardLayout>
    );
}


export default LiveTracking;