import DashboardLayout from "../layouts/DashboardLayout";

function Shipments() {

    return (
        <DashboardLayout>

            <div className="dashboard-header">

                <div>
                    <h1>
                        Shipments
                    </h1>

                    <p>
                        Manage and monitor coal consignments.
                    </p>
                </div>

                <button className="primary-button">
                    + New Consignment
                </button>

            </div>

            <div className="panel">

                <div className="empty-page">

                    Shipment management will be connected
                    to the FastAPI shipment APIs.

                </div>

            </div>

        </DashboardLayout>
    );
}

export default Shipments;