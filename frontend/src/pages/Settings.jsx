import { useEffect, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";

import api from "../services/api";

function Settings() {
    const [health, setHealth] =
        useState(null);

    const [provider, setProvider] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [
                    healthResponse,
                    providerResponse
                ] = await Promise.all([
                    api.get("/health"),
                    api.get("/provider/status")
                ]);

                setHealth(
                    healthResponse.data
                );

                setProvider(
                    providerResponse.data
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <DashboardLayout>

            <main className="page-container">

                <div className="dashboard-hero">

                    <div>
                        <span className="eyebrow">
                            SYSTEM / SETTINGS
                        </span>

                        <h1>
                            System settings
                            <span>.</span>
                        </h1>

                        <p>
                            CoalVision platform and provider
                            configuration status.
                        </p>
                    </div>

                </div>

                <div className="dashboard-grid">

                    <div className="content-card">

                        <div className="content-card-header">
                            <div>
                                <span className="section-kicker">
                                    PLATFORM
                                </span>

                                <h2>
                                    Backend status
                                </h2>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: 24
                            }}
                        >

                            <p>
                                <strong>
                                    API:
                                </strong>{" "}
                                {loading
                                    ? "Checking..."
                                    : health
                                        ? "Connected"
                                        : "Unavailable"}
                            </p>

                            <p>
                                <strong>
                                    Provider:
                                </strong>{" "}
                                {provider
                                    ? provider.provider ??
                                    provider.name ??
                                    "Configured"
                                    : "Unavailable"}
                            </p>

                            <p>
                                <strong>
                                    Mode:
                                </strong>{" "}
                                Simulation / Historical Replay
                            </p>

                        </div>

                    </div>

                    <div className="content-card">

                        <div className="content-card-header">
                            <div>
                                <span className="section-kicker">
                                    MACHINE LEARNING
                                </span>

                                <h2>
                                    ETA engine
                                </h2>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: 24
                            }}
                        >

                            <p>
                                <strong>
                                    Model:
                                </strong>{" "}
                                XGBoost
                            </p>

                            <p>
                                <strong>
                                    Purpose:
                                </strong>{" "}
                                ETA and delay prediction
                            </p>

                            <p>
                                <strong>
                                    Data:
                                </strong>{" "}
                                Simulation telemetry
                            </p>

                        </div>

                    </div>

                </div>

            </main>

        </DashboardLayout>
    );
}

export default Settings;