import { NavLink } from "react-router-dom";


function Sidebar() {
    return (
        <aside className="sidebar">

            <div className="sidebar-brand">
                <div className="brand-logo">
                    CV
                </div>

                <div>
                    <h1>CoalVision</h1>
                    <p>Multimodal Logistics</p>
                </div>
            </div>


            <nav className="sidebar-nav">

                <div className="nav-section">
                    <div className="nav-section-title">
                        MAIN
                    </div>

                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">▦</span>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/shipments"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">▣</span>
                        <span>Shipments</span>
                    </NavLink>

                    <NavLink
                        to="/alerts"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">!</span>
                        <span>Alerts</span>
                    </NavLink>
                </div>


                <div className="nav-section">
                    <div className="nav-section-title">
                        OPERATIONS
                    </div>

                    <NavLink
                        to="/tracking"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">⌖</span>
                        <span>Live Tracking</span>
                    </NavLink>

                    <NavLink
                        to="/analytics"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">◫</span>
                        <span>Analytics</span>
                    </NavLink>

                    <NavLink
                        to="/reports"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">▤</span>
                        <span>Reports</span>
                    </NavLink>
                </div>


                <div className="nav-section">
                    <div className="nav-section-title">
                        SYSTEM
                    </div>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">⚙</span>
                        <span>Settings</span>
                    </NavLink>
                </div>

            </nav>


            <div className="sidebar-user">

                <div className="user-avatar">
                    LM
                </div>

                <div className="user-info">
                    <strong>Logistics Manager</strong>
                    <span>Operations</span>
                </div>

            </div>

        </aside>
    );
}


export default Sidebar;