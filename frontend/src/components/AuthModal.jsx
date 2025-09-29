import { useState } from "react";
import ErrorModal from "./ErrorModal";
import grafanaLogo from "../images/grafana-logo.png";
import influxLogo from "../images/influxdb-logo.png";
import "../styles/Auth.css";

export default function AuthModal({ isOpen, onClose }) {
    // default to combined login so user can enter both, coz the app need both to work nice
    const [mode, setMode] = useState("combined"); // combined | influx-login | grafana-login
    const [formData, setFormData] = useState({
        influxToken: "",
        influxOrg: "",
        influxUrl: "", // optional
        grafanaToken: "",
        grafanaOrgId: "",
        grafanaUrl: "", // optional; falls back to backend .env
    });
    const [message, setMessage] = useState("");
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // helper to call backend auth, returns {ok, json}
    const postJSON = async (url, body, bearer) => {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
            },
            body: JSON.stringify(body),
            credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
    };

    // combined login flow: influx first, then grafana (second call merges payload w/ existing jwt)
    const handleCombinedLogin = async () => {
        if (!formData.influxToken) {
            setMessage("please enter influx token");
            setErrorModalOpen(true);
            return;
        }
        if (!formData.grafanaToken) {
            setMessage("please enter grafana token");
            setErrorModalOpen(true);
            return;
        }

        setSubmitting(true);
        setMessage("");

        try {
            // 1) login influx
            const influxBody = {
                influxToken: formData.influxToken,
                influxOrg: formData.influxOrg || undefined,
                influxUrl: formData.influxUrl || undefined,
            };
            const influxRes = await postJSON("http://localhost:5001/api/auth/login/influx", influxBody);
            if (!influxRes.ok) {
                setMessage(influxRes.data.error || influxRes.data.message || "influx login failed");
                setErrorModalOpen(true);
                setSubmitting(false);
                return;
            }
            // save token so we can merge on second call
            const influxAccess = influxRes.data.accessToken;
            sessionStorage.setItem("accessToken", influxAccess);

            // 2) login grafana, pass Bearer so backend can merge payloads
            const grafanaBody = {
                grafanaToken: formData.grafanaToken,
                grafanaOrgId: formData.grafanaOrgId || undefined,
                grafanaUrl: formData.grafanaUrl || undefined,
            };
            const grafRes = await postJSON("http://localhost:5001/api/auth/login/grafana", grafanaBody, influxAccess);
            if (!grafRes.ok) {
                setMessage((grafRes.data.error || "grafana login failed") + (grafRes.data.details ? `: ${grafRes.data.details}` : ""));
                setErrorModalOpen(true);
                setSubmitting(false);
                return;
            }
            // final token now contains both influx + grafana creds
            sessionStorage.setItem("accessToken", grafRes.data.accessToken);

            // all good -> small success and reload app
            setMessage("login successful!");
            window.location.reload();
        } catch (err) {
            console.error(err);
            setMessage("server error, pls try again");
            setErrorModalOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    // single-provider login kept for flexibility (user can still log just one, but app might not fully work)
    const handleSingleLogin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage("");
        try {
            if (mode === "influx-login") {
                const body = {
                    influxToken: formData.influxToken,
                    influxOrg: formData.influxOrg || undefined,
                    influxUrl: formData.influxUrl || undefined,
                };
                const { ok, data } = await postJSON("http://localhost:5001/api/auth/login/influx", body);
                if (!ok) {
                    setMessage(data.error || data.message || "login failed");
                    setErrorModalOpen(true);
                    setSubmitting(false);
                    return;
                }
                sessionStorage.setItem("accessToken", data.accessToken);
                window.location.reload();
            } else if (mode === "grafana-login") {
                const body = {
                    grafanaToken: formData.grafanaToken,
                    grafanaOrgId: formData.grafanaOrgId || undefined,
                    grafanaUrl: formData.grafanaUrl || undefined,
                };
                const { ok, data } = await postJSON("http://localhost:5001/api/auth/login/grafana", body);
                if (!ok) {
                    setMessage((data.error || "login failed") + (data.details ? `: ${data.details}` : ""));
                    setErrorModalOpen(true);
                    setSubmitting(false);
                    return;
                }
                sessionStorage.setItem("accessToken", data.accessToken);
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            setMessage("server error, please try again");
            setErrorModalOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    const renderForm = () => {
        if (mode === "combined") {
            return (
                <div className="auth-form two-col">
                    {/* influx block */}
                    <div className="auth-block">
                        <div className="auth-block-title">
                            <img src={influxLogo} alt="InfluxDB" className="oauth-logo" />
                            <span>InfluxDB</span>
                        </div>
                        <div className="form-group">
                            <label>InfluxDB Token</label>
                            <input
                                type="text"
                                name="influxToken"
                                value={formData.influxToken}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>InfluxDB Org (optional)</label>
                            <input
                                type="text"
                                name="influxOrg"
                                value={formData.influxOrg || ""}
                                onChange={handleChange}
                                placeholder="leave empty to use default"
                            />
                        </div>
                        <div className="form-group">
                            <label>InfluxDB URL (optional)</label>
                            <input
                                type="text"
                                name="influxUrl"
                                value={formData.influxUrl || ""}
                                onChange={handleChange}
                                placeholder="http://localhost:8086 (defaults if empty)"
                            />
                        </div>
                    </div>

                    {/* grafana block */}
                    <div className="auth-block">
                        <div className="auth-block-title">
                            <img src={grafanaLogo} alt="Grafana" className="oauth-logo" />
                            <span>Grafana</span>
                        </div>
                        <div className="form-group">
                            <label>Grafana Service Account Token</label>
                            <input
                                type="text"
                                name="grafanaToken"
                                value={formData.grafanaToken}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Grafana Org ID</label>
                            <input
                                type="text"
                                name="grafanaOrgId"
                                value={formData.grafanaOrgId || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Grafana URL (optional)</label>
                            <input
                                type="text"
                                name="grafanaUrl"
                                value={formData.grafanaUrl || ""}
                                onChange={handleChange}
                                placeholder="http://localhost:3000 (defaults if empty)"
                            />
                        </div>
                    </div>

                    <div className="auth-actions">
                        <button
                            type="button"
                            className="btn-auth"
                            onClick={handleCombinedLogin}
                            disabled={submitting}
                        >
                            {submitting ? "Logging in…" : "Log in to InfluxDB + Grafana"}
                        </button>
                        <div className="auth-inline-switch">
                            {/* some users still prefer single provider login, so leave a quick toggle */}
                            <button type="button" className="link-btn" onClick={() => setMode("influx-login")}>
                                influx only
                            </button>
                            <span>·</span>
                            <button type="button" className="link-btn" onClick={() => setMode("grafana-login")}>
                                grafana only
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // legacy single-provider forms (kept, but combined is recommended)
        if (mode === "influx-login") {
            return (
                <form onSubmit={handleSingleLogin} className="auth-form">
                    <div className="form-group">
                        <label>InfluxDB Token</label>
                        <input
                            type="text"
                            name="influxToken"
                            value={formData.influxToken}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>InfluxDB Org (optional)</label>
                        <input
                            type="text"
                            name="influxOrg"
                            value={formData.influxOrg || ""}
                            onChange={handleChange}
                            placeholder="leave empty to use default"
                        />
                    </div>
                    <div className="form-group">
                        <label>InfluxDB URL (optional)</label>
                        <input
                            type="text"
                            name="influxUrl"
                            value={formData.influxUrl || ""}
                            onChange={handleChange}
                            placeholder="http://localhost:8086 (defaults if empty)"
                        />
                    </div>
                    <button type="submit" className="btn-auth" disabled={submitting}>
                        {submitting ? "Logging in…" : "Log In"}
                    </button>
                    <div className="auth-inline-switch">
                        <button type="button" className="link-btn" onClick={() => setMode("combined")}>
                            use combined login instead
                        </button>
                    </div>
                </form>
            );
        }

        if (mode === "grafana-login") {
            return (
                <form onSubmit={handleSingleLogin} className="auth-form">
                    <div className="form-group">
                        <label>Grafana Service Account Token</label>
                        <input
                            type="text"
                            name="grafanaToken"
                            value={formData.grafanaToken}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Grafana Org ID</label>
                        <input
                            type="text"
                            name="grafanaOrgId"
                            value={formData.grafanaOrgId || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Grafana URL (optional)</label>
                        <input
                            type="text"
                            name="grafanaUrl"
                            value={formData.grafanaUrl || ""}
                            onChange={handleChange}
                            placeholder="http://localhost:3000 (defaults if empty)"
                        />
                    </div>
                    <button type="submit" className="btn-auth" disabled={submitting}>
                        {submitting ? "Logging in…" : "Log In"}
                    </button>
                    <div className="auth-inline-switch">
                        <button type="button" className="link-btn" onClick={() => setMode("combined")}>
                            use combined login instead
                        </button>
                    </div>
                </form>
            );
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay">
                <div className="modal">
                    <button className="modal-close" onClick={onClose}>x</button>
                    <h2>
                        {mode === "combined"
                            ? "Login to InfluxDB + Grafana"
                            : mode === "grafana-login"
                                ? "Login with Grafana"
                                : "Login with InfluxDB"}
                    </h2>
                    {renderForm()}
                </div>
            </div>

            {errorModalOpen && (
                <ErrorModal
                    message={message}
                    onClose={() => setErrorModalOpen(false)}
                />
            )}
        </>
    );
}