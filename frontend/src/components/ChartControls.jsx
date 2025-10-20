export default function ChartControls({ chartType, setChartType, onSave }) {
    return (
        <div className="chart-controls">
            <div className="chart-type-selector">
                <label className="form-label">Chart Type:</label>
                <select
                    className="form-control"
                    style={{ width: "auto" }}
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                >
                    <option value="line">Line Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="bar">Bar Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="histogram">Histogram</option>
                    <option value="heatmap">Heatmap</option>
                </select>
            </div>
            <div className="chart-options">
                <button className="btn btn-secondary">Chart Options</button>
                <button className="btn btn-secondary" onClick={onSave}>Save Dashboard</button>
            </div>
        </div>
    );
}
