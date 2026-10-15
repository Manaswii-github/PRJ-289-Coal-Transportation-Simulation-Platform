import { Link } from "react-router-dom";

const shipments = [
    {
        code: "CN-1042",
        route: "Talcher → Visakhapatnam",
        mode: "MULTIMODAL",
        status: "DELAYED",
        eta: "16:40"
    },
    {
        code: "CN-1041",
        route: "Korba → Raipur",
        mode: "ROAD",
        status: "IN_TRANSIT",
        eta: "15:20"
    },
    {
        code: "CN-1040",
        route: "Singrauli → Renukoot",
        mode: "RAIL",
        status: "IN_TRANSIT",
        eta: "18:10"
    },
    {
        code: "CN-1039",
        route: "Ib Valley → Jharsuguda",
        mode: "ROAD",
        status: "DELIVERED",
        eta: "14:05"
    }
];

function ShipmentTable() {

    return (
        <div className="panel shipment-panel">

            <div className="panel-heading">

                <div>
                    <h2>Recent Shipments</h2>
                    <p>
                        Latest movement across the network
                    </p>
                </div>

                <Link to="/shipments">
                    View all
                </Link>

            </div>

            <div className="shipment-table-container">

                <table className="shipment-table">

                    <thead>

                        <tr>
                            <th>Consignment</th>
                            <th>Route</th>
                            <th>Mode</th>
                            <th>Status</th>
                            <th>ETA</th>
                        </tr>

                    </thead>

                    <tbody>

                        {shipments.map((shipment) => (

                            <tr key={shipment.code}>

                                <td>
                                    <Link
                                        to={`/shipments/${shipment.code}`}
                                        className="shipment-code"
                                    >
                                        {shipment.code}
                                    </Link>
                                </td>

                                <td>
                                    {shipment.route}
                                </td>

                                <td>
                                    <span className="mode">
                                        {shipment.mode}
                                    </span>
                                </td>

                                <td>
                                    <span
                                        className={`shipment-status ${shipment.status.toLowerCase()}`}
                                    >
                                        {shipment.status.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </td>

                                <td>
                                    {shipment.eta}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default ShipmentTable;