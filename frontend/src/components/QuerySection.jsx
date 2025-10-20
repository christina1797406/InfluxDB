// imports
import { useState, useEffect } from "react";
import DataSource from "./DataSource";
import FieldSelector from "./FieldSelector";
import QueryBuilder from "./QueryBuilder";
import SavedQueries from "./SavedQueries";
import TimeControls from "./TimeControls";

export default function QuerySection({ dashboardId, onExportToGrafana, onQueryStats }) {
    // variables for selected bucket and measurement
    const [selectedBucket, setSelectedBucket] = useState("");
    const [selectedMeasurement, setSelectedMeasurement] = useState("");
    const [selectedFields, setSelectedFields] = useState([]);

    // query builder states
    const [filters, setFilters] = useState([]); // [{fieldType, fieldName, operator, value, logicAfter}]
    const [groupBy, setGroupBy] = useState([]); // [{name, type}]
    const [aggregate, setAggregate] = useState("mean"); // mean,sum,min,max,count,last,first
    const [windowEvery, setWindowEvery] = useState("1m");
    const [createEmpty, setCreateEmpty] = useState(false);
    const [mathExpr, setMathExpr] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState("30s");

    // time controls state
    const [timePreset, setTimePreset] = useState("Last 15m");
    const [timeFrom, setTimeFrom] = useState("");
    const [timeTo, setTimeTo] = useState("");
    const [timezone, setTimezone] = useState("local");

    // key for per-dashboard temp storage
    const storeKey = `qs:dash:${dashboardId || "default"}`;

    // hydrate from sessionStorage on mount / dashboard switch
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(storeKey);
            if (!raw) return;
            const st = JSON.parse(raw);
            setSelectedBucket(st.bucket || "");
            setSelectedMeasurement(st.measurement || "");
            setSelectedFields(st.fields || []);
            setFilters(st.filters || []);
            setGroupBy(st.groupBy || []);
            setAggregate(st.aggregate || "mean");
            setWindowEvery(st.windowEvery || "1m");
            setCreateEmpty(!!st.createEmpty);
            setMathExpr(st.mathExpr || "");
            setAutoRefresh(!!st.autoRefresh);
            setRefreshInterval(st.refreshInterval || "30s");
            setTimePreset(st.timePreset || "Last 15m");
            setTimeFrom(st.timeFrom || "");
            setTimeTo(st.timeTo || "");
            // timezone intentionally left as-is unless stored
            if (st.timezone) setTimezone(st.timezone);
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeKey]);

    const buildState = () => ({
        bucket: selectedBucket,
        measurement: selectedMeasurement,
        fields: selectedFields,
        filters,
        groupBy,
        aggregate,
        windowEvery,
        timePreset,
        timeFrom,
        timeTo,
        // include optional fields:
        mathExpr,
        autoRefresh,
        refreshInterval,
        createEmpty,
        timezone,
    });

    // persist builder state per dashboard whenever it changes
    useEffect(() => {
        try {
            sessionStorage.setItem(storeKey, JSON.stringify(buildState()));
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        storeKey,
        selectedBucket, selectedMeasurement, selectedFields,
        filters, groupBy, aggregate, windowEvery, createEmpty,
        mathExpr, autoRefresh, refreshInterval,
        timePreset, timeFrom, timeTo, timezone
    ]);

    // handler to add a field/tag if not already present
    const handleFieldDrop = (field) => {
        setSelectedFields(prev =>
            prev.some(f => f.name === field.name && f.type === field.type)
                ? prev
                : [...prev, field]
        );
    };

    // handler to remove a field/tag
    const handleFieldRemove = (field) => {
        setSelectedFields(prev =>
            prev.filter(f => !(f.name === field.name && f.type === field.type))
        );
    };

    // filters/group-by handlers
    const handleAddFilter = (field) => {
        setFilters(prev => [...prev, {
            fieldType: field.type,
            fieldName: field.name,
            operator: "=",
            value: "",
            logicAfter: prev.length > 0 ? "AND" : "" // show logic after all but first
        }]);
    };
    // patch is an object with keys to update
    const handleUpdateFilter = (index, patch) => {
        setFilters(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
    };
    // remove filter at index
    const handleRemoveFilter = (index) => {
        setFilters(prev => prev.filter((_, i) => i !== index));
    };
    // add group by if not already present
    const handleGroupDrop = (field) => {
        setGroupBy(prev =>
            prev.some(g => g.name === field.name && g.type === field.type) ? prev : [...prev, { name: field.name, type: field.type }]
        );
    };
    // remove group by at index
    const handleRemoveGroup = (index) => {
        setGroupBy(prev => prev.filter((_, i) => i !== index));
    };

    // build flux from current ui state (simple, not cover every edge but good enough)
    const buildFluxFromState = (st) => {
        const presetToRange = (p) => {
            const map = {
                'Last 5m': '-5m', 'Last 15m': '-15m', 'Last 30m': '-30m',
                'Last 1h': '-1h', 'Last 6h': '-6h', 'Last 12h': '-12h',
                'Last 24h': '-24h', 'Last 7d': '-7d', 'Last 30d': '-30d',
                'Last 3 months': '-3mo',
            };
            return map[p] || '-1h';
        };

        const rangeLine = st.timePreset === 'Custom' && st.timeFrom && st.timeTo
            ? `|> range(start: ${JSON.stringify(st.timeFrom)}, stop: ${JSON.stringify(st.timeTo)})`
            : `|> range(start: ${presetToRange(st.timePreset)})`;

        const meas = st.measurement ? `|> filter(fn: (r) => r._measurement == ${JSON.stringify(st.measurement)})` : '';

        const selectedFieldNames = (st.fields || []).filter(f => f.type === 'FIELD').map(f => f.name);
        const keepFields = selectedFieldNames.length
            ? `|> filter(fn: (r) => r._field =~ /${selectedFieldNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}/)`
            : '';

        const toFluxOp = (op) => (op === '=' ? '==' : op);

        const mkColRef = (f) => {
            if (f.fieldType === 'FIELD') return 'r._field';
            // tag keys may contain chars; always use bracket notation
            return `r[${JSON.stringify(f.fieldName)}]`;
        };

        const filterParts = (st.filters || []).map((f, idx) => {
            const op = f.operator || '=';
            const colRef = mkColRef(f);
            const valueLit = (op === 'regex')
                ? new RegExp(f.value || '').toString()
                : JSON.stringify(f.value ?? '');

            let expr;
            if (op === 'regex') {
                expr = `${colRef} =~ ${valueLit}`;
            } else if (op === 'contains' || op === '!contains') {
                // substring contains using strings.containsStr
                expr = `strings.containsStr(v: string(v: ${colRef}), substr: ${JSON.stringify(String(f.value || ''))})`;
                if (op === '!contains') expr = `not (${expr})`;
            } else {
                expr = `${colRef} ${toFluxOp(op)} ${valueLit}`;
            }

            const logic = idx > 0 ? (st.filters[idx - 1].logicAfter || 'AND') : '';
            return { logic, expr };
        });

        const needsStringsImport = (st.filters || []).some(f => f.operator === 'contains' || f.operator === '!contains');

        let filterLine = '';
        if (filterParts.length) {
            const where = filterParts.reduce((acc, cur, i) => {
                const seg = `(${cur.expr})`;
                if (i === 0) return seg;
                return `${acc} ${cur.logic === 'OR' ? 'or' : 'and'} ${seg}`;
            }, '');
            filterLine = `|> filter(fn: (r) => ${where})`;
        }

        // Group By: allow grouping by selected tags/fields
        const groupCols = (st.groupBy || []).map(g => g.type === 'FIELD' ? '_field' : g.name);
        const uniqueGroupCols = Array.from(new Set(groupCols));
        const groupLine = uniqueGroupCols.length
            ? `|> group(columns: [${uniqueGroupCols.map(n => JSON.stringify(n)).join(', ')}])`
            : '';

        const windowLine = st.windowEvery
            ? `|> aggregateWindow(every: ${st.windowEvery}, fn: ${st.aggregate || 'mean'}, createEmpty: ${!!st.createEmpty})`
            : '';
        const sortLine = '|> sort(columns: ["_time"])';

        const lines = [
            needsStringsImport ? 'import "strings"' : null,
            `from(bucket: ${JSON.stringify(st.bucket)})`,
            rangeLine,
            meas,
            keepFields,
            filterLine,
            groupLine,
            windowLine,
            sortLine,
        ].filter(Boolean);

        return lines.join('\n  ');
    };

    // Reset builder UI (does not touch Saved Queries)
    const handleResetBuilder = () => {
        setSelectedFields([]);
        setFilters([]);
        setGroupBy([]);
        setAggregate("mean");
        setWindowEvery("1m");
        setCreateEmpty(false);
        setMathExpr("");
        setAutoRefresh(false);
        setRefreshInterval("30s");
        // keep time preset and datasource as-is, unless you prefer to reset:
        // setSelectedBucket(""); setSelectedMeasurement(""); setTimePreset("Last 15m");
    };

    // handler to run query and export to Grafana, also measure exec time via backend
    const handleRunQuery = async () => {
        const builderState = buildState();
        if (!builderState.bucket || !builderState.measurement) {
            alert("Select a bucket and measurement first.");
            return;
        }
        // Persist snapshot for this tab (already auto-saved, but keep explicit)
        try { sessionStorage.setItem(storeKey, JSON.stringify(builderState)); } catch { }

        try {
            // 1) create grafana panel (embed url)
            const res = await fetch("http://localhost:5001/api/grafana/dashboards/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
                },
                body: JSON.stringify({ builderState }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to create Grafana panel");
                return;
            }
            onExportToGrafana && onExportToGrafana({
                url: data.url,
                uid: data.uid,
                panelUrl: data.panelUrl,
                panelImageUrl: data.panelImageUrl,
            });

            // 2) run the flux on backend to get real exec time
            const flux = buildFluxFromState(builderState);
            let execMs = null;
            try {
                const q = await fetch("http://localhost:5001/api/influx/query", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
                    },
                    body: JSON.stringify({ query: flux }),
                });
                const qData = await q.json();
                if (q.ok) execMs = Math.round(qData.tookMs || 0);
            } catch {
                // ignore timing errors, not fatal
            }
            onQueryStats && onQueryStats({ flux, execMs, builderState });
        } catch (e) {
            console.error(e);
            alert("Failed to contact Grafana. Check backend logs.");
        }
    };

    // Save current builder state into Saved Queries
    const handleSaveQuery = () => {
        const builderState = buildState();
        if (!builderState.bucket || !builderState.measurement) {
            alert("Select a bucket and measurement first.");
            return;
        }
        const defaultName = `${builderState.measurement} – ${builderState.fields.filter(f => f.type === 'FIELD').map(f => f.name).join(', ') || 'query'}`;
        const name = window.prompt("Query name:", defaultName) || "";
        if (!name.trim()) return;

        // choose or create folder by name
        const folderName = window.prompt("Folder name (existing or new):", "Saved") || "Saved";

        // compute flux snapshot for convenience
        const flux = buildFluxFromState(builderState);

        // notify SavedQueries to persist (decouple via event to keep components simple)
        window.dispatchEvent(new CustomEvent("savedQueries:add", {
            detail: {
                folderName,
                query: { name: name.trim(), builderState, flux }
            }
        }));
    };

    // Load a saved query back into the UI
    const handleLoadSaved = (saved) => {
        const st = saved?.builderState || {};
        setSelectedBucket(st.bucket || "");
        setSelectedMeasurement(st.measurement || "");
        setSelectedFields(st.fields || []);
        setFilters(st.filters || []);
        setGroupBy(st.groupBy || []);
        setAggregate(st.aggregate || "mean");
        setWindowEvery(st.windowEvery || "1m");
        setMathExpr(st.mathExpr || "");
        setAutoRefresh(st.autoRefresh || false);
        setRefreshInterval(st.refreshInterval || "30s");
        setTimePreset(st.timePreset || "Last 15m");
        setTimeFrom(st.timeFrom || "");
        setTimeTo(st.timeTo || "");
        if (st.timezone) setTimezone(st.timezone);
    };

    // NEW: Add a combined series clause => (tagKey=tagValue AND _field=fieldName), OR-chained
    const handleAddSeriesClause = ({ fieldName, tagKey, tagValue }) => {
        // ensure the field is present in Selected Fields (so it isn't filtered out by keepFields)
        setSelectedFields(prev =>
            prev.some(f => f.type === 'FIELD' && f.name === fieldName)
                ? prev
                : [...prev, { type: 'FIELD', name: fieldName }]
        );

        setFilters(prev => {
            const next = [...prev];
            if (next.length > 0) {
                // OR with previous clause block
                next[next.length - 1] = { ...next[next.length - 1], logicAfter: "OR" };
            }
            // clause: tag equality then field equality with AND between them
            next.push({
                fieldType: 'TAG',
                fieldName: tagKey,
                operator: '=',
                value: String(tagValue),
                logicAfter: 'AND'
            });
            next.push({
                fieldType: 'FIELD',
                fieldName: fieldName,
                operator: '=',
                value: fieldName,
                logicAfter: '' // end of clause
            });
            return next;
        });
    };

    // render
    return (
        <div className="query-section">
            <div className="left-stack">
                <DataSource
                    selectedBucket={selectedBucket}
                    selectedMeasurement={selectedMeasurement}
                    onBucketSelect={setSelectedBucket}
                    onMeasurementSelect={setSelectedMeasurement}
                />
                <TimeControls
                    timePreset={timePreset} onChangeTimePreset={setTimePreset}
                    timeFrom={timeFrom} onChangeTimeFrom={setTimeFrom}
                    timeTo={timeTo} onChangeTimeTo={setTimeTo}
                    timezone={timezone} onChangeTimezone={setTimezone}
                />
            </div>

            <FieldSelector
                bucket={selectedBucket}
                measurement={selectedMeasurement}
                onFieldDragStart={field => window.draggedField = field}
            />

            <QueryBuilder
                selectedFields={selectedFields}
                onFieldDrop={handleFieldDrop}
                onFieldRemove={handleFieldRemove}
                filters={filters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onRemoveFilter={handleRemoveFilter}
                groupBy={groupBy}
                onGroupDrop={handleGroupDrop}
                onRemoveGroup={handleRemoveGroup}
                aggregate={aggregate}
                onChangeAggregate={setAggregate}
                windowEvery={windowEvery}
                onChangeWindowEvery={setWindowEvery}
                createEmpty={createEmpty}
                onChangeCreateEmpty={setCreateEmpty}
                mathExpr={mathExpr}
                onChangeMathExpr={setMathExpr}
                autoRefresh={autoRefresh}
                onChangeAutoRefresh={setAutoRefresh}
                refreshInterval={refreshInterval}
                onChangeRefreshInterval={setRefreshInterval}
                onRunQuery={handleRunQuery}
                onSaveQuery={handleSaveQuery}
                onResetQuery={handleResetBuilder}
                onAddSeriesClause={handleAddSeriesClause} // NEW
            />

            <SavedQueries onLoadQuery={handleLoadSaved} />
        </div>
    );
}
