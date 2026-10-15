import DashboardLayout from "../layouts/DashboardLayout";
import AlertPanel from "../components/AlertPanel";

function Alerts() {

    return (
        <DashboardLayout>

            <div className="dashboard-header">

                <div>

                    <h1>
                        Alerts
                    </h1>

                    <p>
                        Monitor and resolve operational exceptions.
                    </p>

                </div>

            </div>

            <AlertPanel />

        </DashboardLayout>
    );
}

export default Alerts;