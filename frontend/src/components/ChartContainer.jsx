import { useEffect, useMemo, useState } from "react";

export default function ChartContainer({ chartType, grafanaPanel }) {
    // tiny state to drive iframe fallback
    const [iframeError, setIframeError] = useState(false); // if embed fail we show image instead (yeh it simple)

    // new: backend render url using short-lived ticket
    const [renderUrl, setRenderUrl] = useState(""); // will hold server proxy img url

    // force iframe to re-mount when url changes, avoids stale content
    const iframeKey = useMemo(() => grafanaPanel?.panelUrl || "no-panel", [grafanaPanel?.panelUrl]);

    // reset states when panel changes (also clear render url)
    useEffect(() => {
        setIframeError(false);
        setRenderUrl("");
    }, [grafanaPanel?.panelUrl, grafanaPanel?.uid, grafanaPanel?.panelImageUrl]); // include img dep so hooks deps are happy

    // when we have a grafana panel uid, ask backend for a one-time render url
    useEffect(() => {
        if (!grafanaPanel?.uid) return;

        let cancelled = false; // tiny guard, dont set state if unmounted – kind of important

        const makeTicket = async () => {
            try {
                const res = await fetch("http://localhost:5001/api/grafana/panel/ticket", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}`,
                    },
                    body: JSON.stringify({
                        uid: grafanaPanel.uid,
                        panelId: 1,
                        width: 1100,
                        height: 500,
                        theme: "dark",
                    }),
                });
                const data = await res.json();
                if (cancelled) return;

                if (res.ok && data.renderUrl) {
                    // cache-buster so user see new image after refresh, not stale one
                    setRenderUrl(`http://localhost:5001${data.renderUrl}&ts=${Date.now()}`);
                } else {
                    // fallback to direct grafana render url if ticket failed
                    setRenderUrl(grafanaPanel?.panelImageUrl || "");
                }
            } catch {
                if (!cancelled) setRenderUrl(grafanaPanel?.panelImageUrl || "");
            }
        };

        makeTicket();
        return () => { cancelled = true };
    }, [grafanaPanel?.uid, grafanaPanel?.panelImageUrl]); // add missing dep to fix lint

    return (
        <div className="chart-container">
            {grafanaPanel?.panelUrl ? (
                <div
                    className="grafana-embed"
                    // Constrain the embed so it cannot overlay other UI
                    style={{ position: "relative", height: 520, maxWidth: "100%", overflow: "hidden" }}
                >
                    {/* try iframe first (interactive). if blocked -> show server proxied image */}
                    {!iframeError ? (
                        <iframe
                            key={iframeKey}
                            title="Grafana Panel"
                            src={grafanaPanel.panelUrl}
                            // Fill only this box
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                            frameBorder="0"
                            onError={() => setIframeError(true)}
                            // Optional: allow scripts/popups used by Grafana
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                    ) : (
                        <img
                            alt="grafana panel render"
                            src={renderUrl}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                        />
                    )}
                </div>
            ) : (
                <div className="chart-placeholder">
                    📈 {chartType.toUpperCase()} Visualization - Full Width View
                    <div>Run a query to render with Grafana</div>
                </div>
            )}
        </div>
    );
}
