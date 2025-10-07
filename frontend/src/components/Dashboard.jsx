import { useState } from "react";
import DashboardTabs from "./DashboardTabs";
import QuerySection from "./QuerySection";
import VisualisationSection from "./VisualisationSection";

export default function Dashboard() {
  // hold the selected Grafana panel for export
  const [grafanaPanel, setGrafanaPanel] = useState(null);
  // also store last flux + exec time so status can show true timing
  const [lastFlux, setLastFlux] = useState("");
  const [lastExecMs, setLastExecMs] = useState(null);

  return (
    <div className="container">
      <DashboardTabs />
      {/* Main area */}
      <div className="main-content">
        <QuerySection
          onExportToGrafana={setGrafanaPanel}
          onQueryStats={({ flux, execMs }) => {
            setLastFlux(flux || "");
            setLastExecMs(typeof execMs === "number" ? Math.round(execMs) : null);
          }}
        />
        <VisualisationSection grafanaPanel={grafanaPanel} flux={lastFlux} execMs={lastExecMs} />
      </div>
    </div>
  );
}
