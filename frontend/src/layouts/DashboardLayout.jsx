import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";


function DashboardLayout({ children }) {
    return (
        <div className="dashboard-layout">

            <Sidebar />

            <div className="main-content">

                <Navbar />

                {children}

            </div>

        </div>
    );
}


export default DashboardLayout;