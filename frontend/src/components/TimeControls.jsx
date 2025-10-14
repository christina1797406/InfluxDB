// import
import React from "react";

export default function TimeControls({
    timePreset, onChangeTimePreset,
    timeFrom, onChangeTimeFrom,
    timeTo, onChangeTimeTo,
    timezone, onChangeTimezone
}) {
    return (
        <div className="card time-controls">
            <div className="card-title">Time</div>
            <div className="form-group">
                <label className="form-label">Preset</label>
                <select
                    className="form-control"
                    value={timePreset}
                    onChange={(e) => onChangeTimePreset(e.target.value)}
                >
                    <option value="Last 5m">Last 5m</option>
                    <option value="Last 15m">Last 15m</option>
                    <option value="Last 30m">Last 30m</option>
                    <option value="Last 1h">Last 1h</option>
                    <option value="Last 6h">Last 6h</option>
                    <option value="Last 12h">Last 12h</option>
                    <option value="Last 24h">Last 24h</option>
                    <option value="Last 7d">Last 7d</option>
                    <option value="Last 30d">Last 30d</option>
                    <option value="Last 3 months">Last 3 months</option>
                    <option value="Custom">Custom</option>
                </select>
            </div>

            {timePreset === "Custom" && (
                <div className="controls-row">
                    <div className="control">
                        <label className="form-label">From</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            value={timeFrom}
                            onChange={(e) => onChangeTimeFrom(e.target.value)}
                        />
                    </div>
                    <div className="control">
                        <label className="form-label">To</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            value={timeTo}
                            onChange={(e) => onChangeTimeTo(e.target.value)}
                        />
                    </div>
                </div>
            )}
            <div className="form-group">
                <label className="form-label">Timezone</label>
                <select value={timezone} onChange={(e) => onChangeTimezone(e.target.value)}>
                    <option value="local">Local</option>
                    <option value="UTC">UTC</option>
                    <option value="Australia/Adelaide">Australia/Adelaide</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                </select>
            </div>
        </div>
    );
}