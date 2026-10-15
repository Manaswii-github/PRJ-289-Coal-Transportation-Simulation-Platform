import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAnalyticsSummary } from "../services/analyticsService";


function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(
        Number(value || 0)
    );
}


function formatTonnage(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
    }).format(
        Number(value || 0)
    );
}


function formatMinutes(value) {
    const minutes = Number(value || 0);

    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remaining = Math.round(minutes % 60);

    if (remaining === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
}


function DonutChart({
    items,
    total,
    centerLabel
}) {
    const safeItems = Array.isArray(items)
        ? items
        : [];

    const safeTotal = Number(total || 0);

    const segments = useMemo(() => {
        if (safeTotal <= 0) {
            return "conic-gradient(#e4e9ed 0deg 360deg)";
        }

        let current = 0;

        const colors = [
            "#0d5b78",
            "#ef8a24",
            "#5b8c5a",
            "#c9532d",
            "#7b61a8"
        ];

        const parts = safeItems.map(
            (item, index) => {

                const value = Number(
                    item.value || 0
                );

                const degrees =
                    (value / safeTotal) * 360;

                const start = current;

                current += degrees;

                return `${colors[index % colors.length]} ${start}deg ${current}deg`;
            }
        );

        return `conic-gradient(${parts.join(", ")})`;
    }, [safeItems, safeTotal]);

    return (
        <div className="analytics-donut-wrap">

            <div
                className="analytics-donut"
                style={{
                    background: segments
                }}
            >
                <div className="analytics-donut-inner">
                    <strong>
                        {formatNumber(safeTotal)}
                    </strong>

                    <span>
                        {centerLabel}
                    </span>
                </div>
            </div>

            <div className="analytics-donut-legend">

                {safeItems.map(
                    (item, index) => {

                        const value = Number(
                            item.value || 0
                        );

                        const percentage =
                            safeTotal > 0
                                ? Math.round(
                                    (
                                        value /
                                        safeTotal
                                    ) * 100
                                )
                                : 0;

                        return (
                            <div
                                className="analytics-legend-row"
                                key={`${item.name}-${index}`}
                            >

                                <div className="analytics-legend-name">

                                    <span
                                        className="analytics-dot"
                                        style={{
                                            background:
                                                [
                                                    "#0d5b78",
                                                    "#ef8a24",
                                                    "#5b8c5a",
                                                    "#c9532d",
                                                    "#7b61a8"
                                                ][
                                                    index % 5
                                                ]
                                        }}
                                    />

                                    <span>
                                        {item.name}
                                    </span>

                                </div>

                                <strong>
                                    {formatNumber(value)}
                                    {" "}
                                    ({percentage}%)
                                </strong>

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}


function Analytics() {

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [lastUpdated, setLastUpdated] =
        useState(null);


    const loadAnalytics = async () => {

        try {

            setError("");

            const response =
                await getAnalyticsSummary();

            setData(response);

            setLastUpdated(
                new Date()
            );

        } catch (err) {

            console.error(
                "Analytics loading error:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to load simulation data from database."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        loadAnalytics();

        const timer = setInterval(
            loadAnalytics,
            30000
        );

        return () => {
            clearInterval(timer);
        };

    }, []);


    const summary =
        data?.summary || {};

    const fleet =
        data?.fleet_distribution || [];

    const delays =
        data?.delay_buckets || [];

    const daily =
        data?.daily || [];

    const routes =
        data?.routes || [];

    const performance =
        data?.performance || {};


    const totalMovements =
        Number(
            summary.total_movements || 0
        );

    const activeMovements =
        Number(
            summary.active_movements || 0
        );

    const completedMovements =
        Number(
            summary.completed_movements || 0
        );

    const delayedMovements =
        Number(
            summary.delayed_movements || 0
        );

    const tonnage =
        Number(
            summary.total_tonnage || 0
        );

    const onTime =
        Number(
            summary.on_time_percentage || 0
        );


    const delayTotal = delays.reduce(
        (sum, item) =>
            sum + Number(item.value || 0),
        0
    );


    return (
        <DashboardLayout>

            <div className="analytics-page">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="analytics-header">

                    <div>

                        <div className="analytics-kicker">
                            MANAGEMENT / ANALYTICS
                        </div>

                        <h1>
                            Operational Analytics.
                        </h1>

                        <p>
                            Performance and fleet analytics
                            from the historical simulation dataset.
                        </p>

                    </div>

                    <div className="analytics-refresh">

                        <span className="analytics-live-dot" />

                        <span>
                            Auto refresh every 30 seconds
                        </span>

                        {lastUpdated && (
                            <small>
                                Updated{" "}
                                {lastUpdated.toLocaleTimeString()}
                            </small>
                        )}

                    </div>

                </div>


                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && (

                    <div className="analytics-error">

                        <strong>
                            Analytics error
                        </strong>

                        <span>
                            {error}
                        </span>

                        <button
                            onClick={loadAnalytics}
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =====================================================
                    LOADING
                ====================================================== */}

                {loading && !data ? (

                    <div className="analytics-loading">
                        Loading simulation analytics...
                    </div>

                ) : (

                    <>

                        {/* =================================================
                            KPI CARDS
                        ================================================== */}

                        <div className="analytics-kpi-grid">

                            <div className="analytics-kpi-card">

                                <div className="analytics-kpi-top">
                                    <span>
                                        TOTAL MOVEMENTS
                                    </span>

                                    <b>
                                        01
                                    </b>
                                </div>

                                <strong>
                                    {formatNumber(
                                        totalMovements
                                    )}
                                </strong>

                                <div className="analytics-kpi-bottom">
                                    <span>
                                        FLEET
                                    </span>

                                    <small>
                                        rail + road
                                    </small>
                                </div>

                            </div>


                            <div className="analytics-kpi-card">

                                <div className="analytics-kpi-top">
                                    <span>
                                        ACTIVE
                                    </span>

                                    <b>
                                        →
                                    </b>
                                </div>

                                <strong>
                                    {formatNumber(
                                        activeMovements
                                    )}
                                </strong>

                                <div className="analytics-kpi-bottom">
                                    <span>
                                        IN TRANSIT
                                    </span>

                                    <small>
                                        current simulation state
                                    </small>
                                </div>

                            </div>


                            <div className="analytics-kpi-card">

                                <div className="analytics-kpi-top">
                                    <span>
                                        DELAYED
                                    </span>

                                    <b>
                                        !
                                    </b>
                                </div>

                                <strong>
                                    {formatNumber(
                                        delayedMovements
                                    )}
                                </strong>

                                <div className="analytics-kpi-bottom">
                                    <span>
                                        EXCEPTIONS
                                    </span>

                                    <small>
                                        scheduled vs actual arrival
                                    </small>
                                </div>

                            </div>


                            <div className="analytics-kpi-card">

                                <div className="analytics-kpi-top">
                                    <span>
                                        COAL TONNAGE
                                    </span>

                                    <b>
                                        MT
                                    </b>
                                </div>

                                <strong>
                                    {formatTonnage(
                                        tonnage
                                    )}
                                </strong>

                                <div className="analytics-kpi-bottom">
                                    <span>
                                        SIMULATED
                                    </span>

                                    <small>
                                        movement payload
                                    </small>
                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            FLEET + DELAYS
                        ================================================== */}

                        <div className="analytics-two-column">

                            <section className="analytics-panel">

                                <div className="analytics-panel-header">

                                    <div>

                                        <span>
                                            FLEET MIX
                                        </span>

                                        <h2>
                                            RAIL AND ROAD DISTRIBUTION
                                        </h2>

                                    </div>

                                    <div className="analytics-source">
                                        <span />
                                        DATABASE
                                    </div>

                                </div>

                                <div className="analytics-panel-body">

                                    <DonutChart
                                        items={fleet}
                                        total={totalMovements}
                                        centerLabel="MOVEMENTS"
                                    />

                                </div>

                            </section>


                            <section className="analytics-panel">

                                <div className="analytics-panel-header">

                                    <div>

                                        <span>
                                            DELAY PROFILE
                                        </span>

                                        <h2>
                                            DELAY BUCKETS
                                        </h2>

                                    </div>

                                </div>

                                <div className="analytics-panel-body">

                                    <DonutChart
                                        items={delays}
                                        total={delayTotal}
                                        centerLabel="MOVEMENTS"
                                    />

                                </div>

                            </section>

                        </div>


                        {/* =================================================
                            DAILY TREND + PERFORMANCE
                        ================================================== */}

                        <div className="analytics-two-column">

                            <section className="analytics-panel">

                                <div className="analytics-panel-header">

                                    <div>

                                        <span>
                                            MOVEMENT TREND
                                        </span>

                                        <h2>
                                            DAILY MOVEMENT VOLUME
                                        </h2>

                                        <p>
                                            Scheduled movement count
                                            by simulation date.
                                        </p>

                                    </div>

                                </div>

                                <div className="analytics-daily-chart">

                                    {daily.map(
                                        (item) => {

                                            const maxValue =
                                                Math.max(
                                                    ...daily.map(
                                                        day =>
                                                            Number(
                                                                day.total || 0
                                                            )
                                                    ),
                                                    1
                                                );

                                            const height =
                                                (
                                                    Number(
                                                        item.total || 0
                                                    ) /
                                                    maxValue
                                                ) * 100;

                                            return (
                                                <div
                                                    className="analytics-day"
                                                    key={item.date}
                                                >

                                                    <div className="analytics-day-bar-wrap">

                                                        <div
                                                            className="analytics-day-bar"
                                                            style={{
                                                                height: `${height}%`
                                                            }}
                                                        />

                                                    </div>

                                                    <strong>
                                                        {formatNumber(
                                                            item.total
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {String(
                                                            item.date
                                                        ).slice(5)}
                                                    </span>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                                <div className="analytics-chart-legend">

                                    <span>
                                        Rail
                                    </span>

                                    <span>
                                        Road
                                    </span>

                                </div>

                            </section>


                            <section className="analytics-panel">

                                <div className="analytics-panel-header">

                                    <div>

                                        <span>
                                            PERFORMANCE
                                        </span>

                                        <h2>
                                            TRANSIT HEALTH
                                        </h2>

                                    </div>

                                </div>

                                <div className="analytics-performance">

                                    <div className="analytics-metric-row">

                                        <span>
                                            Average transit
                                        </span>

                                        <strong>
                                            {formatMinutes(
                                                performance.avg_transit_minutes
                                            )}
                                        </strong>

                                    </div>


                                    <div className="analytics-metric-row">

                                        <span>
                                            Average delay
                                        </span>

                                        <strong>
                                            {formatMinutes(
                                                performance.avg_delay_minutes
                                            )}
                                        </strong>

                                    </div>


                                    <div className="analytics-metric-row">

                                        <span>
                                            Maximum delay
                                        </span>

                                        <strong>
                                            {formatMinutes(
                                                performance.max_delay_minutes
                                            )}
                                        </strong>

                                    </div>


                                    <div className="analytics-metric-row">

                                        <span>
                                            On-time movement rate
                                        </span>

                                        <strong>
                                            {onTime.toFixed(1)}%
                                        </strong>

                                    </div>


                                    <div className="analytics-progress">

                                        <div
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(
                                                        onTime,
                                                        0
                                                    ),
                                                    100
                                                )}%`
                                            }}
                                        />

                                    </div>

                                </div>

                            </section>

                        </div>


                        {/* =================================================
                            CORRIDOR TABLE
                        ================================================== */}

                        <section className="analytics-panel analytics-corridor-panel">

                            <div className="analytics-panel-header">

                                <div>

                                    <span>
                                        CORRIDOR PERFORMANCE
                                    </span>

                                    <h2>
                                        ROUTE ACTIVITY
                                    </h2>

                                    <p>
                                        Movement volume, payload and
                                        simulated delay by corridor.
                                    </p>

                                </div>

                            </div>


                            <div className="analytics-table-wrap">

                                <table className="analytics-table">

                                    <thead>

                                        <tr>
                                            <th>
                                                MODE
                                            </th>

                                            <th>
                                                SOURCE
                                            </th>

                                            <th>
                                                DESTINATION
                                            </th>

                                            <th>
                                                MOVEMENTS
                                            </th>

                                            <th>
                                                TONNAGE
                                            </th>

                                            <th>
                                                AVG DELAY
                                            </th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {routes.map(
                                            (route, index) => (

                                                <tr
                                                    key={`${route.source}-${route.destination}-${route.mode}-${index}`}
                                                >

                                                    <td>

                                                        <span
                                                            className={
                                                                route.mode === "RAIL"
                                                                    ? "analytics-mode rail"
                                                                    : "analytics-mode road"
                                                            }
                                                        >
                                                            {route.mode}
                                                        </span>

                                                    </td>

                                                    <td>
                                                        {route.source}
                                                    </td>

                                                    <td>
                                                        {route.destination}
                                                    </td>

                                                    <td>
                                                        {formatNumber(
                                                            route.movement_count
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatTonnage(
                                                            route.tonnage
                                                        )}
                                                        {" t"}
                                                    </td>

                                                    <td>
                                                        {formatMinutes(
                                                            route.avg_delay_minutes
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>


                        {/* =================================================
                            FOOTER NOTE
                        ================================================== */}

                        <div className="analytics-footnote">

                            <strong>
                                SIMULATION / HISTORICAL REPLAY
                            </strong>

                            <span>
                                All movement, location, delay,
                                weather and coal payload values shown
                                here belong to the project's synthetic
                                simulation dataset. They are not live
                                FOIS or CRIS operational records.
                            </span>

                        </div>

                    </>

                )}

            </div>

        </DashboardLayout>
    );
}


export default Analytics;