import { useState, useEffect } from "react";
import DashboardTabs from "./DashboardTabs";
import QuerySection from "./QuerySection";
import VisualisationSection from "./VisualisationSection";

const DASH_STORAGE = "ui:dashboards:v1";
const ACTIVE_KEY = "ui:dashboards:activeId";

export default function Dashboard() {
  // default 3 dashboards (only used if nothing persisted)
  const defaultDashboards = [
    { id: 1, name: "Dashboard 1", grafanaPanel: null, lastFlux: "", lastExecMs: null, lastBuilderState: null },
    { id: 2, name: "Dashboard 2", grafanaPanel: null, lastFlux: "", lastExecMs: null, lastBuilderState: null },
    { id: 3, name: "Dashboard 3", grafanaPanel: null, lastFlux: "", lastExecMs: null, lastBuilderState: null },
  ];

  const [dashboards, setDashboards] = useState(() => {
    try {
      const raw = localStorage.getItem(DASH_STORAGE);
      if (raw) {
        const saved = JSON.parse(raw);
        // Drop any persisted grafanaPanel so a broken/old UID doesn't mount an overlaying iframe
        return (Array.isArray(saved) ? saved : defaultDashboards).map(d => ({ ...d, grafanaPanel: null }));
      }
    } catch { }
    return defaultDashboards;
  });

  const [activeId, setActiveId] = useState(() => {
    const raw = localStorage.getItem(ACTIVE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(parsed) ? parsed : 1;
  });

  // keep dashboards persisted
  useEffect(() => {
    localStorage.setItem(DASH_STORAGE, JSON.stringify(dashboards));
    // ensure activeId always points to an existing dashboard
    if (!dashboards.some(d => d.id === activeId) && dashboards.length > 0) {
      setActiveId(dashboards[0].id);
    }
  }, [dashboards, activeId]);

  // persist active tab
  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, String(activeId));
  }, [activeId]);

  // add new dashboard
  const addDashboard = () => {
    setDashboards(prev => {
      const newId = prev.length ? Math.max(...prev.map(d => d.id)) + 1 : 1;
      const next = [...prev, { id: newId, name: `Dashboard ${newId}`, grafanaPanel: null, lastFlux: "", lastExecMs: null, lastBuilderState: null }];
      setActiveId(newId);
      return next;
    });
  };

  // remove dashboard by id (+ clear its temp builder state)
  const removeDashboard = (id) => {
    setDashboards(prev => {
      const filtered = prev.filter(d => d.id !== id);
      // clear per-tab temp state
      try { sessionStorage.removeItem(`qs:dash:${id}`); } catch { }
      // adjust active after removal
      if (activeId === id && filtered.length > 0) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  };

  // update dashboard data by id
  const updateDashboard = (dashboardId, updates) => {
    setDashboards(prev =>
      prev.map(d => (d.id === dashboardId ? { ...d, ...updates } : d))
    );
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
          {/* Force a fresh QuerySection per dashboard so builder state resets on switch,
              but QuerySection will rehydrate from sessionStorage for this dashboard id */}
          <QuerySection
            key={active.id}
            dashboardId={active.id}
            onExportToGrafana={(panel) => updateDashboard(active.id, { grafanaPanel: panel })}
            onQueryStats={({ flux, execMs, builderState }) => {
              updateDashboard(active.id, {
                lastFlux: flux || "",
                lastExecMs: typeof execMs === "number" ? Math.round(execMs) : null,
                lastBuilderState: builderState || null
              });
            }}
          />
          <VisualisationSection
            grafanaPanel={active.grafanaPanel}
            flux={active.lastFlux}
            execMs={active.lastExecMs}
            onSaveDashboard={async () => {
              try {
                const title = window.prompt("Dashboard title:", active.name || "New Dashboard") || "";
                if (!title.trim()) return;

                const body = {
                  title: title.trim(),
                  builderState: active.lastBuilderState || undefined,
                  flux: active.lastFlux || undefined
                };

                const res = await fetch("http://localhost:5001/api/grafana/dashboards/save", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
                  },
                  body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!res.ok) {
                  alert(data.error || "Failed to save dashboard");
                  return;
                }
                updateDashboard(active.id, {
                  grafanaPanel: {
                    url: data.url,
                    uid: data.uid,
                    panelUrl: data.panelUrl,
                    panelImageUrl: data.panelImageUrl
                  }
                });
                alert("Dashboard saved.");
              } catch (e) {
                console.error(e);
                alert("Save failed. See console.");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
