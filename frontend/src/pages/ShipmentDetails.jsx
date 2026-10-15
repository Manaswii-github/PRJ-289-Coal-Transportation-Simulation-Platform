import DashboardLayout from "../layouts/DashboardLayout";
import { useParams } from "react-router-dom";

function ShipmentDetails() {

    const { id } = useParams();

    return (
        <DashboardLayout>

            <div className="dashboard-header">

                <div>

                    <h1>
                        Shipment {id}
                    </h1>

                    <p>
                        Multimodal consignment details
                    </p>

                </div>

            </div>

            <div className="panel">

                <div className="empty-page">

                    Road → Siding → Rail → Plant

                    <br /><br />

                    Shipment timeline and telemetry
                    will be connected here.

                </div>

            </div>

        </DashboardLayout>
    );
}

export default ShipmentDetails;