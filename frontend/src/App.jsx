import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Shipments from "./pages/Shipments";
import ShipmentDetails from "./pages/ShipmentDetails";
import Alerts from "./pages/Alerts";
import LiveTracking from "./pages/LiveTracking";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
    return (
        <Routes>

            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/dashboard"
                element={<Dashboard />}
            />

            <Route
                path="/shipments"
                element={<Shipments />}
            />

            <Route
                path="/shipments/:id"
                element={<ShipmentDetails />}
            />

            <Route
                path="/alerts"
                element={<Alerts />}
            />

            <Route
                path="/tracking"
                element={<LiveTracking />}
            />

            <Route
                path="/analytics"
                element={<Analytics />}
            />

            <Route
                path="/reports"
                element={<Reports />}
            />

            <Route
                path="/settings"
                element={<Settings />}
            />

            <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
            />

        </Routes>
    );
}

export default App;