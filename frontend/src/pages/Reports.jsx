import { useEffect, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";

import {
    getSimulationTrains,
    getSimulationTrucks
} from "../services/simulationService";

function Reports() {
    const [trains, setTrains] =
        useState([]);

    const [trucks, setTrucks] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [
                    trainData,
                    truckData
                ] = await Promise.all([
                    getSimulationTrains(),
                    getSimulationTrucks()
                ]);

                setTrains(trainData || []);
                setTrucks(truckData || []);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const generateCsv = () => {
        const rows = [
            [
                "Movement",
                "Type",
                "Source",
                "Destination",
                "Status",
                "Speed",
                "Delay",
                "ETA"
            ]
        ];

        trains.forEach((item) => {
            rows.push([
                item.movement_code ?? "",
                "RAIL",
                item.source ?? "",
                item.destination ?? "",
                item.status ?? "",
                item.speed ??
                    item.speed_kmph ??
                    "",
                item.predicted_delay ??
                    item.previous_delay ??
                    "",
                item.predicted_eta ?? ""
            ]);
        });

        trucks.forEach((item) => {
            rows.push([
                item.movement_code ?? "",
                "ROAD",
                item.source ?? "",
                item.destination ?? "",
                item.status ?? "",
                item.speed ??
                    item.speed_kmph ??
                    "",
                item.predicted_delay ??
                    item.previous_delay ??
                    "",
                item.predicted_eta ?? ""
            ]);
        });

        const csv =
            rows
                .map((row) =>
                    row
                        .map(
                            (value) =>
                                `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
                )
                .join("\n");

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            `coalvision-report-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

        link.click();

        URL.revokeObjectURL(
            url
        );
    };

    return (
        <DashboardLayout>

            <main className="page-container">

                <div className="dashboard-hero">

                    <div>
                        <span className="eyebrow">
                            OPERATIONS / REPORTS
                        </span>

                        <h1>
                            Operational reports
                            <span>.</span>
                        </h1>

                        <p>
                            Generate a report from the
                            current fleet data.
                        </p>
                    </div>

                </div>

                <div className="content-card">

                    <div className="content-card-header">

                        <div>
                            <span className="section-kicker">
                                FLEET REPORT
                            </span>

                            <h2>
                                Movement report
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={
                                generateCsv
                            }
                            disabled={loading}
                        >
                            Export CSV
                        </button>

                    </div>

                    <div
                        style={{
                            padding: 24
                        }}
                    >

                        <div className="stats-grid">

                            <div className="stat-card">
                                <span className="stat-title">
                                    RAIL MOVEMENTS
                                </span>

                                <div className="stat-value">
                                    {trains.length}
                                </div>
                            </div>

                            <div className="stat-card">
                                <span className="stat-title">
                                    ROAD MOVEMENTS
                                </span>

                                <div className="stat-value">
                                    {trucks.length}
                                </div>
                            </div>

                            <div className="stat-card">
                                <span className="stat-title">
                                    TOTAL
                                </span>

                                <div className="stat-value">
                                    {trains.length +
                                        trucks.length}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </main>

        </DashboardLayout>
    );
}

export default Reports;