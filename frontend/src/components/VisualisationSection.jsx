import { useState } from "react";
import ChartContainer from "./ChartContainer";
import ChartControls from "./ChartControls";
import FluxCodePanel from "./FluxCodePanel";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function VisualizationSection() {
    const [activeTab, setActiveTab] = useState("chart");
    const [chartType, setChartType] = useState("line");
    const [showFlux, setShowFlux] = useState(false);
    const [exporting, setExporting] = useState(false);

    const exportToGrafana = async () => {
        try {
            setExporting(true);
            const builderState = JSON.parse(localStorage.getItem('queryState') || '{}');
            if (!builderState.bucket) {
                alert('Please select a bucket (and measurement) first.');
                setExporting(false);
                return;
            }
            const res = await fetchWithAuth('http://localhost:5001/api/grafana/dashboards/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Exported from INFLUX-UI',
                    panelTitle: `Panel - ${builderState.measurement || 'Query'}`,
                    builderState
                })
            });
            const data = await res.json();
            if (!res.ok) {
                console.error('Export error:', data);
                alert(`Failed to export to Grafana: ${data?.error || 'Unknown error'}`);
                setExporting(false);
                return;
            }
            // Open created dashboard
            if (data.url) window.open(data.url, '_blank');
        } catch (e) {
            console.error(e);
            alert('Export failed. Check server logs.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="visualization-section">
            <div className="card visualization-panel">

                <div className="tabs">
                    <div className={`tab ${activeTab === "chart" ? "active" : ""}`} onClick={() => setActiveTab("chart")}>
                        Chart View
                    </div>
                    <div className={`tab ${activeTab === "table" ? "active" : ""}`} onClick={() => setActiveTab("table")}>
                        Table View
                    </div>
                </div>

                <ChartControls chartType={chartType} setChartType={setChartType} />
                <ChartContainer activeTab={activeTab} chartType={chartType} />
                <FluxCodePanel showFlux={showFlux} setShowFlux={setShowFlux} />

                <div className="btn-group" style={{ marginTop: "16px" }}>
                    <button className="btn btn-primary" onClick={exportToGrafana} disabled={exporting}>
                        {exporting ? 'Exporting…' : 'Export to Grafana'}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigator.clipboard.writeText("flux query code here")}
                    >
                        Copy Flux Code
                    </button>
                </div>
            </div>
        </div>
    );
}
