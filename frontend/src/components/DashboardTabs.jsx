import { useState } from "react";

export default function DashboardTabs() {
    const [dashboards, setDashboards] = useState([
        { id: 1, name: "Dashboard 1" },
        { id: 2, name: "Dashboard 2" },
        { id: 3, name: "Dashboard 3" },
    ]);
    const [activeId, setActiveId] = useState(1);

    const addDashboard = () => {
        const newId = dashboards.length ? dashboards[dashboards.length - 1].id + 1 : 1;
        setDashboards([...dashboards, { id: newId, name: `Dashboard ${newId}` }]);
        setActiveId(newId);
    };

    const removeDashboard = (id) => {
        setDashboards(dashboards.filter(d => d.id !== id));
        if (activeId === id && dashboards.length > 1) {
            setActiveId(dashboards[0].id); // fallback to first dashboard
        }
    };

    return (
        <div className="dashboard-tabs">
            {dashboards.map(d => (
                <div
                    key={d.id}
                    className={`dashboard-tab ${d.id === activeId ? "active" : ""}`}
                    onClick={() => setActiveId(d.id)}
                >
                    <span>{d.name}</span>
                    <span
                        className="close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeDashboard(d.id);
                        }}
                    >
                        X
                    </span>
                </div>
            ))}

            <div className="add-dashboard-btn" onClick={addDashboard}>
                <span>+</span><span>New Dashboard</span>
            </div>

            <div className="dashboard-actions">
                <button className="dashboard-action-btn">Save All</button>
                <button className="dashboard-action-btn">Settings</button>
            </div>
        </div>
    );
}

