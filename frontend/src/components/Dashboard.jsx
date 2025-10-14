import { useState } from "react";
import DashboardTabs from "./DashboardTabs";
import QuerySection from "./QuerySection";
import VisualisationSection from "./VisualisationSection";

export default function Dashboard() {
  const [dashboards, setDashboards] = useState([
    { id: 1, name: "Dashboard 1", grafanaPanel: null, lastFlux: "", lastExecMs: null },
    { id: 2, name: "Dashboard 2", grafanaPanel: null, lastFlux: "", lastExecMs: null },
    { id: 3, name: "Dashboard 3", grafanaPanel: null, lastFlux: "", lastExecMs: null },
  ]);
  const [activeId, setActiveId] = useState(1);

  // add new dashboard
  const addDashboard = () => {
    const newId = dashboards.length ? Math.max(...dashboards.map(d => d.id)) + 1 : 1;
    setDashboards([...dashboards, {
      id: newId,
      name: `Dashboard ${newId}`,
      grafanaPanel: null,
      lastFlux: "",
      lastExecMs: null
    }]);
    setActiveId(newId);
  };

  // remove dashboard by id
  const removeDashboard = (id) => {
    const filtered = dashboards.filter(d => d.id !== id);
    setDashboards(filtered);
    if (activeId === id && filtered.length > 0) {
      setActiveId(filtered[0].id);
    }
  };

  // update dashboard data by id
  const updateDashboard = (dashboardId, updates) => {
    setDashboards(dashboards.map(d =>
      d.id === dashboardId ? { ...d, ...updates } : d
    ));
  };

  const active = dashboards.find(d => d.id === activeId);

  return (
    <div className="container">
      <DashboardTabs
        dashboards={dashboards}
        activeId={activeId}
        onSetActive={setActiveId}
        onAdd={addDashboard}
        onRemove={removeDashboard}
      />
      {active && (
        <div className="main-content">
          {/* Force a fresh QuerySection per dashboard so builder state resets on switch */}
          <QuerySection
            key={active.id} // NEW
            onExportToGrafana={(panel) => updateDashboard(active.id, { grafanaPanel: panel })}
            onQueryStats={({ flux, execMs }) => {
              updateDashboard(active.id, {
                lastFlux: flux || "",
                lastExecMs: typeof execMs === "number" ? Math.round(execMs) : null
              });
            }}
          />
          <VisualisationSection
            grafanaPanel={active.grafanaPanel}
            flux={active.lastFlux}
            execMs={active.lastExecMs}
          />
        </div>
      )}
    </div>
  );
}
