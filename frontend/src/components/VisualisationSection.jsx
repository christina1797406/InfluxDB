import { useState } from "react";
import ChartContainer from "./ChartContainer";
import ChartControls from "./ChartControls";
import FluxCodePanel from "./FluxCodePanel";

// main visualisation section with chart controls, container, and flux code panel
export default function VisualizationSection({ grafanaPanel, flux, execMs, onSaveDashboard }) {
    const [chartType, setChartType] = useState("line");
    const [showFlux, setShowFlux] = useState(false);

    // render
    return (
        <div className="visualization-section">
            <div className="card visualization-panel">
                {/* Removed tabs; only chart view remains */}
                <ChartControls chartType={chartType} setChartType={setChartType} onSave={onSaveDashboard} />
                <ChartContainer chartType={chartType} grafanaPanel={grafanaPanel} />
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
