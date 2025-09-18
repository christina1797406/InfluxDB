// import
import React from "react";

export default function TimeControls({
  timePreset, onChangeTimePreset,
  timeFrom, onChangeTimeFrom,
  timeTo, onChangeTimeTo,
  timezone, onChangeTimezone
}) {
  return (
    <div className="card">
      <div className="card-title">Time Controls</div>

      <div className="form-group">
        <label className="form-label">Preset</label>
        <select value={timePreset} onChange={(e) => onChangeTimePreset(e.target.value)}>
          <option>Last 5m</option>
          <option>Last 15m</option>
          <option>Last 30m</option>
          <option>Last 1h</option>
          <option>Last 6h</option>
          <option>Last 12h</option>
          <option>Last 24h</option>
          <option>Last 7d</option>
          <option>Last 30d</option>
          <option>Custom</option>
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
    {/*  might delete later - added it for scalability if required */}
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