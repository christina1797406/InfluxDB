import { useState } from "react";
import ChartContainer from "./ChartContainer";
import ChartControls from "./ChartControls";
import FluxCodePanel from "./FluxCodePanel";

// main visualisation section with tabs, chart controls, container, and flux code panel
export default function VisualizationSection({ grafanaPanel, flux, execMs }) {
    const [activeTab, setActiveTab] = useState("chart");
    const [chartType, setChartType] = useState("line");
    const [showFlux, setShowFlux] = useState(false);

    // render
    return (
        <div className="visualization-section">
            <div className="card visualization-panel">
                <div className="tabs">
                    <div className={`tab ${activeTab === "chart" ? "active" : ""}`} onClick={() => setActiveTab("chart")}>Chart View</div>
                    <div className={`tab ${activeTab === "table" ? "active" : ""}`} onClick={() => setActiveTab("table")}>Table View</div>
                </div>

                {/* Always render controls + container; the container decides to show Grafana or placeholder */}
                <ChartControls chartType={chartType} setChartType={setChartType} />
                <ChartContainer activeTab={activeTab} chartType={chartType} grafanaPanel={grafanaPanel} />
                <FluxCodePanel showFlux={showFlux} setShowFlux={setShowFlux} flux={flux} execMs={execMs} />

                <div className="btn-group" style={{ marginTop: "16px" }}>
                    {grafanaPanel?.url && (
                        <a className="btn btn-secondary" href={grafanaPanel.url} target="_blank" rel="noreferrer">Open in Grafana</a>
                    )}
                </div>
            </div>
        </div>
    );
}
