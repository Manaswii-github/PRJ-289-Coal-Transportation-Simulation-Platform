import { Link } from "react-router-dom";

const alerts = [
    {
        id: 1,
        severity: "HIGH",
        title: "Shipment Delay",
        shipment: "CN-1042",
        message: "ETA exceeded by 2h 14m",
        time: "12 min ago"
    },
    {
        id: 2,
        severity: "MEDIUM",
        title: "Signal Stale",
        shipment: "CN-1037",
        message: "Last telemetry received 17 min ago",
        time: "17 min ago"
    },
    {
        id: 3,
        severity: "INFO",
        title: "Siding Handover",
        shipment: "CN-1031",
        message: "Rail handover completed successfully",
        time: "32 min ago"
    }
];

function AlertPanel() {
    return (
        <div className="panel alert-panel">
            <div className="panel-header">
                <div>
                    <h3>Alerts</h3>
                    <p>Recent operational alerts</p>
                </div>

                <span className="alert-count">
                    {alerts.length}
                </span>
            </div>

            <div className="alert-list">
                {alerts.map((alert) => (
                    <div
                        className={`alert-item ${alert.severity.toLowerCase()}`}
                        key={alert.id}
                    >
                        <div className="alert-indicator"></div>

                        <div className="alert-content">
                            <div className="alert-top">
                                <span className="alert-severity">
                                    {alert.severity}
                                </span>

                                <span className="alert-time">
                                    {alert.time}
                                </span>
                            </div>

                            <h4>{alert.title}</h4>

                            <p>
                                <strong>{alert.shipment}</strong>{" "}
                                {alert.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <Link className="view-all-alerts" to="/alerts">
                View All Alerts
                <span aria-hidden="true">→</span>
            </Link>
        </div>
    );
}

export default AlertPanel;