import { useState } from "react";

export default function QueryBuilder({
    selectedFields, onFieldDrop, onFieldRemove,
    filters, onAddFilter, onUpdateFilter, onRemoveFilter,
    groupBy, onGroupDrop, onRemoveGroup,
    aggregate, onChangeAggregate,
    windowEvery, onChangeWindowEvery, createEmpty, onChangeCreateEmpty,
    mathExpr, onChangeMathExpr,
    autoRefresh, onChangeAutoRefresh, refreshInterval, onChangeRefreshInterval,
    onRunQuery, onSaveQuery,
    onResetQuery,
    onAddSeriesClause
}) {
    // handle drop event (selected fields)
    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (data) {
            const field = JSON.parse(data);
            if (onFieldDrop) onFieldDrop(field);
        }
    };

    // drop for filters
    const handleDropFilter = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (data && onAddFilter) onAddFilter(JSON.parse(data));
    };

    // drop for group-by
    const handleDropGroup = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (data && onGroupDrop) onGroupDrop(JSON.parse(data));
    };

    // Quick Series Builder local state
    const [pendingField, setPendingField] = useState(null);
    const [pendingTag, setPendingTag] = useState({ key: null, value: null });

    const handleDropSeriesField = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;
        const payload = JSON.parse(data);
        if (payload.type === "FIELD") {
            setPendingField(payload.name);
        }
    };
    const handleDropSeriesTagValue = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;
        const payload = JSON.parse(data);
        if (payload.type === "TAG_VALUE") {
            setPendingTag({ key: payload.key, value: payload.value });
        }
    };

    const canAddSeries = !!(pendingField && pendingTag.key && pendingTag.value);

    return (
        <div className="card query-builder-card">
            <div className="card-title">Query Builder</div>

            {/* Quick Series Builder (drag a Field and a Tag Value, then add) */}
            <div className="form-group">
                <label className="form-label">Quick Series Builder</label>
                <div className="controls-row">
                    <div
                        className="drag-drop-area"
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDropSeriesField}
                        title="Drop a Field here (e.g. humidity)"
                        style={{ minHeight: 48 }}
                    >
                        <div style={{ color: pendingField ? "#0a0" : "#888", fontSize: 13 }}>
                            {pendingField ? `Field: ${pendingField}` : "Drop Field"}
                        </div>
                    </div>
                    <div
                        className="drag-drop-area"
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDropSeriesTagValue}
                        title="Drop a Tag Value here (e.g. device=TLM0201)"
                        style={{ minHeight: 48 }}
                    >
                        <div style={{ color: pendingTag.value ? "#0a0" : "#888", fontSize: 13 }}>
                            {pendingTag.value ? `Tag: ${pendingTag.key} = ${pendingTag.value}` : "Drop Tag Value"}
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        disabled={!canAddSeries}
                        onClick={() => {
                            if (!canAddSeries) return;
                            onAddSeriesClause && onAddSeriesClause({
                                fieldName: pendingField,
                                tagKey: pendingTag.key,
                                tagValue: pendingTag.value
                            });
                            // reset slots
                            setPendingField(null);
                            setPendingTag({ key: null, value: null });
                        }}
                    >
                        Add series
                    </button>
                </div>
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    Tip: Add multiple series. They will be combined as (tag=value AND _field=field) OR …
                </div>
            </div>

            {/* Selected fields */}
            <div className="form-group">
                <label className="form-label">Selected Fields</label>
                <div
                    className="drag-drop-area"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div style={{ color: "#888", fontSize: 13 }}>
                        Drag fields here to build your query
                    </div>
                    {/* selected fields */}
                    <div className="selected-fields">
                        {selectedFields && selectedFields.length === 0 && (
                            <div style={{ color: "#bbb", fontSize: 12 }}>No fields selected</div>
                        )}
                        {selectedFields && selectedFields.map((field, idx) => (
                            <div key={idx} className="selected-field-item" style={{ display: "flex", alignItems: "center", margin: "4px 0" }}>
                                <span className={`field-type ${field.type === "TAG" ? "tag" : ""}`} style={{ marginRight: 8 }}>
                                    {field.type}
                                </span>
                                <span style={{ marginRight: 8 }}>{field.name}</span>
                                <button
                                    className="btn btn-xs btn-danger"
                                    style={{ marginLeft: "auto" }}
                                    onClick={() => onFieldRemove(field)}
                                >
                                    X
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="form-group">
                <label className="form-label">Filters</label>
                <div
                    className="drop-zone"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropFilter}
                >
                    {/* the drop area for filters */}
                    <div className="drop-hint">Drag fields/tags here to add filters</div>
                    {filters.length === 0 && <div className="muted">No filters</div>}
                    {filters.map((f, i) => (
                        <div key={i} className="filter-row">
                            {i > 0 && (
                                // added some logic operator selector (AND/OR) - need to be tested after grafana integration
                                <select
                                    className="logic-select"
                                    value={f.logicAfter || "AND"}
                                    onChange={(e) => onUpdateFilter(i, { logicAfter: e.target.value })}
                                >
                                    <option value="AND">AND</option>
                                    <option value="OR">OR</option>
                                </select>
                            )}
                            <span className={`chip ${f.fieldType === "TAG" ? "tag" : "field"}`}>
                                {f.fieldType}:{' '}{f.fieldName}
                            </span>
                            <select
                                className="op-select"
                                value={f.operator}
                                onChange={(e) => onUpdateFilter(i, { operator: e.target.value })}
                            >
                                {/*  */}
                                <option>=</option>
                                <option>!=</option>
                                <option>&gt;</option>
                                <option>&gt;=</option>
                                <option>&lt;</option>
                                <option>&lt;=</option>
                                <option>contains</option>
                                <option>!contains</option>
                                <option>regex</option>
                            </select>
                            {/* value input */}
                            <input
                                className="value-input"
                                placeholder="value"
                                value={f.value}
                                onChange={(e) => onUpdateFilter(i, { value: e.target.value })}
                            />
                            <button className="btn btn-xs btn-danger" onClick={() => onRemoveFilter(i)}>×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Group By */}
            <div className="form-group">
                <label className="form-label">Group By</label>
                <div
                    className="drop-zone"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropGroup}
                >
                    <div className="drop-hint">Drag tags/fields here to group</div>
                    <div className="group-by-list">
                        {groupBy.length === 0 && <div className="muted">No groupings</div>}
                        {groupBy.map((g, i) => (
                            <span key={i} className={`chip ${g.type === "TAG" ? "tag" : "field"}`}>
                                {g.type}:{' '}{g.name}
                                <button className="chip-close" onClick={() => onRemoveGroup(i)}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Aggregate + Windowing */}
            <div className="form-group controls-row">
                <div className="control">
                    <label className="form-label">Aggregate</label>
                    <select
                        value={aggregate}
                        onChange={(e) => onChangeAggregate(e.target.value)}
                    >
                        <option value="mean">mean</option>
                        <option value="sum">sum</option>
                        <option value="min">min</option>
                        <option value="max">max</option>
                        <option value="count">count</option>
                        <option value="first">first</option>
                        <option value="last">last</option>
                        <option value="median">median</option>
                        <option value="stddev">stddev</option>
                    </select>
                </div>
                <div className="control">
                    <label className="form-label">Window every</label>
                    <input
                        className="form-control"
                        placeholder="e.g. 1m, 5m, 1h"
                        value={windowEvery}
                        onChange={(e) => onChangeWindowEvery(e.target.value)}
                    />
                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            checked={createEmpty}
                            onChange={(e) => onChangeCreateEmpty(e.target.checked)}
                        />
                        <span>createEmpty</span>
                    </label>
                </div>
            </div>

            {/* Math */}
            <div className="form-group">
                <label className="form-label">Math (expression)</label>
                <input
                    className="form-control"
                    placeholder='e.g. * 2, / 100, or (x * 1.8) + 32'
                    value={mathExpr}
                    onChange={(e) => onChangeMathExpr(e.target.value)}
                />
            </div>

            {/* Auto-refresh */}
            <div className="form-group controls-row">
                <label className="checkbox-inline">
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => onChangeAutoRefresh(e.target.checked)}
                    />
                    <span>Auto-refresh</span>
                </label>
                <select
                    value={refreshInterval}
                    onChange={(e) => onChangeRefreshInterval(e.target.value)}
                    disabled={!autoRefresh}
                >
                    <option value="5s">Every 5s</option>
                    <option value="10s">Every 10s</option>
                    <option value="30s">Every 30s</option>
                    <option value="1m">Every 1m</option>
                    <option value="5m">Every 5m</option>
                </select>
            </div>

            <div className="btn-group action-buttons">
                <button className="btn btn-primary" onClick={onRunQuery}>Run Query</button>
                <button className="btn btn-secondary" onClick={onResetQuery}>Reset</button>
                <button className="btn btn-secondary" onClick={onSaveQuery}>Save Query</button>
            </div>
        </div>
    );
}
