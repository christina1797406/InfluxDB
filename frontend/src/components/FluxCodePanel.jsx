import React from "react";

export default function FluxCodePanel({ showFlux, setShowFlux, flux, execMs }) {
    const html = React.useMemo(() => {
        if (!flux) return "";
        return highlightFlux(flux);
    }, [flux]);

    return (
        <div>
            {/* Toggle & Status */}
            <div className="flux-toggle-container">
                <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span>Connected to InfluxDB</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px" }}>Show Flux Code</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={showFlux}
                            onChange={(e) => setShowFlux(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: "12px" }}>
                        {/* live exec time, if we have one; else show placeholder text */}
                        Query executed in {typeof execMs === "number" ? `${execMs}ms` : "—"}
                    </span>
                </div>
            </div>

            {/* Flux Code Panel */}
            {showFlux && (
                <div className="code-panel">
                    <div
                        className="code"
                        // we inject tiny highlighted html; safe-ish because we escape <,>,&
                        dangerouslySetInnerHTML={{
                            __html: html || '<span class="syntax-comment">// no flux yet, run a query first</span>',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

// minimal highlighter so your index.css colors apply
function highlightFlux(src) {
    // escape html first (keep quotes so string regex works)
    const safe = src
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // strings: "..."
    let out = safe.replace(
        /"([^"\\]|\\.)*"/g,
        '<span class="syntax-string">$&</span>'
    );

    // keywords (simple set)
    out = out.replace(
        /\b(from|range|filter|group|aggregateWindow|aggregate|window|yield|mean|sum|count|first|last|min|max|sort)\b/g,
        '<span class="syntax-keyword">$1</span>'
    );

    // function names before "("
    out = out.replace(
        /(\b[a-zA-Z_]\w*)(\s*\()/g,
        '<span class="syntax-function">$1</span>$2'
    );

    // keep new lines visually
    out = out.replace(/\n/g, "<br/>");
    return out;
}
