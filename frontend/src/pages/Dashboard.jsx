import { useEffect, useMemo, useState } from "react";

import {
    getSimulationTrains,
    getSimulationTrucks
} from "../services/simulationService";

import AlertPanel from "../components/AlertPanel";
import GroqInsight from "../components/GroqInsight";
import DashboardLayout from "../layouts/DashboardLayout";


function Dashboard() {

    const [trains, setTrains] = useState([]);
    const [trucks, setTrucks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [movementFilter, setMovementFilter] =
        useState("ALL");


    const loadSimulationData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                trainData,
                truckData
            ] = await Promise.all([
                getSimulationTrains(),
                getSimulationTrucks()
            ]);

            setTrains(
                Array.isArray(trainData)
                    ? trainData
                    : []
            );

            setTrucks(
                Array.isArray(truckData)
                    ? truckData
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load simulation data:",
                err
            );

            setError(
                "Unable to connect to the CoalVision simulation backend."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        loadSimulationData();

        const refreshTimer =
            setInterval(
                loadSimulationData,
                30000
            );

        return () => {
            clearInterval(
                refreshTimer
            );
        };

    }, []);


    const totalVehicles =
        trains.length +
        trucks.length;


    const activeTrains =
        trains.filter(
            (train) =>
                train.status === "IN_TRANSIT" ||
                train.status === "MOVING" ||
                train.status === "DELAYED" ||
                train.status === "STOPPED"
        ).length;


    const activeTrucks =
        trucks.filter(
            (truck) =>
                truck.status === "IN_TRANSIT" ||
                truck.status === "LOADED" ||
                truck.status === "MOVING" ||
                truck.status === "DELAYED" ||
                truck.status === "STOPPED"
        ).length;


    const delayedTrains =
        trains.filter(
            (train) =>
                train.status === "DELAYED" ||
                Number(
                    train.predicted_delay ||
                    train.previous_delay ||
                    0
                ) > 30
        ).length;


    const delayedTrucks =
        trucks.filter(
            (truck) =>
                truck.status === "DELAYED" ||
                Number(
                    truck.predicted_delay ||
                    truck.previous_delay ||
                    0
                ) > 30
        ).length;


    const delayedVehicles =
        delayedTrains +
        delayedTrucks;


    const deliveredTrains =
        trains.filter(
            (train) =>
                train.status === "ARRIVED" ||
                train.status === "DELIVERED"
        ).length;


    const deliveredTrucks =
        trucks.filter(
            (truck) =>
                truck.status === "DELIVERED"
        ).length;


    const deliveredVehicles =
        deliveredTrains +
        deliveredTrucks;


    const filteredTrains =
        useMemo(() => {

            return trains.filter(
                (train) => {

                    const statusMatches =
                        statusFilter === "ALL" ||
                        train.status ===
                            statusFilter;

                    const typeMatches =
                        movementFilter === "ALL" ||
                        movementFilter === "RAIL";

                    return (
                        statusMatches &&
                        typeMatches
                    );
                }
            );

        }, [
            trains,
            statusFilter,
            movementFilter
        ]);


    const filteredTrucks =
        useMemo(() => {

            return trucks.filter(
                (truck) => {

                    const statusMatches =
                        statusFilter === "ALL" ||
                        truck.status ===
                            statusFilter;

                    const typeMatches =
                        movementFilter === "ALL" ||
                        movementFilter === "ROAD";

                    return (
                        statusMatches &&
                        typeMatches
                    );
                }
            );

        }, [
            trucks,
            statusFilter,
            movementFilter
        ]);


    return (
        <DashboardLayout>

            <main className="page-container dashboard-page">

                <div className="dashboard-hero">

                    <div>

                        <span className="eyebrow">
                            CONTROL ROOM / SIMULATION
                        </span>

                        <h1>
                            Network at a glance
                            <span>.</span>
                        </h1>

                        <p>
                            Operational summary for
                            simulated rail and road
                            coal movements.
                        </p>

                    </div>


                    <div className="hero-status">

                        <span className="live-dot"></span>

                        <div>

                            <strong>
                                SIMULATION MODE
                            </strong>

                            <small>
                                Historical movement dataset
                            </small>

                        </div>

                    </div>

                </div>


                {error && (

                    <div className="dashboard-error">

                        {error}

                    </div>

                )}


                <div className="stats-grid">


                    <div className="stat-card stat-card-accent">

                        <div className="stat-top">

                            <span className="stat-title">
                                TOTAL VEHICLES
                            </span>

                            <span className="stat-mark">
                                01
                            </span>

                        </div>


                        <div className="stat-value">

                            {loading
                                ? "..."
                                : totalVehicles}

                        </div>


                        <div className="stat-bottom">

                            <span className="stat-change positive">
                                RAIL + ROAD
                            </span>

                            <span className="stat-description">
                                simulation fleet
                            </span>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-top">

                            <span className="stat-title">
                                IN TRANSIT
                            </span>

                            <span className="stat-mark transit-mark">
                                →
                            </span>

                        </div>


                        <div className="stat-value">

                            {loading
                                ? "..."
                                : activeTrains +
                                  activeTrucks}

                        </div>


                        <div className="stat-bottom">

                            <span className="stat-change positive">
                                ON ROUTE
                            </span>

                            <span className="stat-description">
                                {activeTrains} trains ·{" "}
                                {activeTrucks} trucks
                            </span>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-top">

                            <span className="stat-title">
                                DELIVERED
                            </span>

                            <span className="stat-mark delivered-mark">
                                ✓
                            </span>

                        </div>


                        <div className="stat-value">

                            {loading
                                ? "..."
                                : deliveredVehicles}

                        </div>


                        <div className="stat-bottom">

                            <span className="stat-change positive">
                                COMPLETED
                            </span>

                            <span className="stat-description">
                                simulation movements
                            </span>

                        </div>

                    </div>


                    <div className="stat-card stat-card-warning">

                        <div className="stat-top">

                            <span className="stat-title">
                                NEEDS ACTION
                            </span>

                            <span className="stat-mark warning-mark">
                                !
                            </span>

                        </div>


                        <div className="stat-value">

                            {loading
                                ? "..."
                                : delayedVehicles}

                        </div>


                        <div className="stat-bottom">

                            <span className="stat-change negative">
                                ATTENTION
                            </span>

                            <span className="stat-description">
                                delayed movements
                            </span>

                        </div>

                    </div>

                </div>


                <div className="dashboard-grid">


                    <div className="content-card rake-list-card">

                        <div className="content-card-header table-header">

                            <div>

                                <span className="section-kicker">
                                    FLEET REGISTER
                                </span>

                                <h2>
                                    Simulation movements
                                </h2>

                            </div>


                            <div className="filter-group">

                                {[
                                    "ALL",
                                    "RAIL",
                                    "ROAD"
                                ].map(
                                    (type) => (

                                        <button
                                            key={type}
                                            className={
                                                movementFilter === type
                                                    ? "filter-button active"
                                                    : "filter-button"
                                            }
                                            onClick={() =>
                                                setMovementFilter(
                                                    type
                                                )
                                            }
                                        >

                                            {type === "ALL"
                                                ? "All units"
                                                : type === "RAIL"
                                                    ? "Trains"
                                                    : "Trucks"}

                                        </button>

                                    )
                                )}


                                {[
                                    "ALL",
                                    "IN_TRANSIT",
                                    "DELAYED",
                                    "DELIVERED"
                                ].map(
                                    (status) => (

                                        <button
                                            key={status}
                                            className={
                                                statusFilter === status
                                                    ? "filter-button active"
                                                    : "filter-button"
                                            }
                                            onClick={() =>
                                                setStatusFilter(
                                                    status
                                                )
                                            }
                                        >

                                            {status === "ALL"
                                                ? "All status"
                                                : status.replace(
                                                    "_",
                                                    " "
                                                )}

                                        </button>

                                    )
                                )}

                            </div>

                        </div>


                        {loading && (

                            <div className="empty-state">
                                Loading simulation data...
                            </div>

                        )}


                        {!loading &&
                            filteredTrains.length === 0 &&
                            filteredTrucks.length === 0 && (

                                <div className="empty-state">
                                    No simulation movements
                                    match the selected filters.
                                </div>

                            )}


                        {!loading &&
                            (
                                filteredTrains.length > 0 ||
                                filteredTrucks.length > 0
                            ) && (

                                <div className="rake-table-wrapper">

                                    <table className="rake-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Movement
                                                </th>

                                                <th>
                                                    Type
                                                </th>

                                                <th>
                                                    Source
                                                </th>

                                                <th>
                                                    Destination
                                                </th>

                                                <th>
                                                    Coal
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Speed
                                                </th>

                                                <th>
                                                    ETA
                                                </th>

                                                <th>
                                                    Delay
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {filteredTrains.map(
                                                (train) => (

                                                    <tr
                                                        key={
                                                            train.movement_code ||
                                                            train.rail_id
                                                        }
                                                    >

                                                        <td>

                                                            <strong>
                                                                🚂{" "}
                                                                {
                                                                    train.movement_code
                                                                }
                                                            </strong>

                                                        </td>


                                                        <td>
                                                            Rail
                                                        </td>


                                                        <td>
                                                            {
                                                                train.source_name ??
                                                                train.source ??
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                train.destination_name ??
                                                                train.destination ??
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                train.coal_grade ??
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>

                                                            <span
                                                                className={`rake-status ${
                                                                    (
                                                                        train.status ||
                                                                        "unknown"
                                                                    ).toLowerCase()
                                                                }`}
                                                            >
                                                                {
                                                                    (
                                                                        train.status ||
                                                                        "UNKNOWN"
                                                                    ).replace(
                                                                        "_",
                                                                        " "
                                                                    )
                                                                }
                                                            </span>

                                                        </td>


                                                        <td>
                                                            {
                                                                train.current_speed_kmph ??
                                                                train.speed ??
                                                                "-"
                                                            }{" "}
                                                            km/h
                                                        </td>


                                                        <td>
                                                            {
                                                                train.predicted_eta
                                                                    ? new Date(
                                                                        train.predicted_eta
                                                                    ).toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour:
                                                                                "2-digit",
                                                                            minute:
                                                                                "2-digit"
                                                                        }
                                                                    )
                                                                    : "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                train.predicted_delay ??
                                                                train.previous_delay ??
                                                                0
                                                            }{" "}
                                                            min
                                                        </td>

                                                    </tr>

                                                )
                                            )}


                                            {filteredTrucks.map(
                                                (truck) => (

                                                    <tr
                                                        key={
                                                            truck.movement_code ||
                                                            truck.truck_id
                                                        }
                                                    >

                                                        <td>

                                                            <strong>
                                                                🚛{" "}
                                                                {
                                                                    truck.movement_code ??
                                                                    truck.truck_code
                                                                }
                                                            </strong>

                                                        </td>


                                                        <td>
                                                            Road
                                                        </td>


                                                        <td>
                                                            {
                                                                truck.source_name ??
                                                                truck.source ??
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                truck.destination_name ??
                                                                truck.destination ??
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                truck.coal_grade ??
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>

                                                            <span
                                                                className={`rake-status ${
                                                                    (
                                                                        truck.status ||
                                                                        "unknown"
                                                                    ).toLowerCase()
                                                                }`}
                                                            >
                                                                {
                                                                    (
                                                                        truck.status ||
                                                                        "UNKNOWN"
                                                                    ).replace(
                                                                        "_",
                                                                        " "
                                                                    )
                                                                }
                                                            </span>

                                                        </td>


                                                        <td>
                                                            {
                                                                truck.current_speed_kmph ??
                                                                truck.speed ??
                                                                "-"
                                                            }{" "}
                                                            km/h
                                                        </td>


                                                        <td>
                                                            {
                                                                truck.predicted_eta
                                                                    ? new Date(
                                                                        truck.predicted_eta
                                                                    ).toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour:
                                                                                "2-digit",
                                                                            minute:
                                                                                "2-digit"
                                                                        }
                                                                    )
                                                                    : "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                truck.predicted_delay ??
                                                                truck.previous_delay ??
                                                                0
                                                            }{" "}
                                                            min
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                    </div>


                    <div className="right-rail">

                        <div className="panel corridor-panel">

                            <div className="panel-heading">

                                <div>

                                    <span className="section-kicker">
                                        NETWORK STATUS
                                    </span>

                                    <h2>
                                        Movement types
                                    </h2>

                                </div>

                                <span className="route-count">
                                    02
                                </span>

                            </div>


                            <div className="route-list">

                                <div>

                                    <span className="route-line"></span>

                                    <strong>
                                        Rail network
                                    </strong>

                                    <small>
                                        {trains.length}
                                        {" "}simulated rakes
                                    </small>

                                </div>


                                <div>

                                    <span className="route-line orange"></span>

                                    <strong>
                                        Road network
                                    </strong>

                                    <small>
                                        {trucks.length}
                                        {" "}simulated trucks
                                    </small>

                                </div>


                                <div>

                                    <span className="route-line green"></span>

                                    <strong>
                                        ETA engine
                                    </strong>

                                    <small>
                                        XGBoost prediction active
                                    </small>

                                </div>

                            </div>

                        </div>


                        <div className="panel">

                            <div className="panel-heading">

                                <div>

                                    <span className="section-kicker">
                                        QUICK ACCESS
                                    </span>

                                    <h2>
                                        Historical replay
                                    </h2>

                                </div>

                            </div>


                            <p
                                style={{
                                    lineHeight: 1.6,
                                    margin: 0
                                }}
                            >
                                Use Live Tracking to select
                                a simulation date and time,
                                replay the fleet, change
                                replay speed, and inspect
                                individual movements.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="dashboard-lower-grid">

                    <GroqInsight />

                    <AlertPanel />

                </div>


            </main>

        </DashboardLayout>
    );
}


export default Dashboard;