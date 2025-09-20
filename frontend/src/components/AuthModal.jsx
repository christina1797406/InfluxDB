import { useState } from "react";
import grafanaLogo from "../images/grafana-logo.png";
import influxLogo from "../images/influxdb-logo.png";
import "../styles/Auth.css";

export default function AuthModal({ isOpen, onClose }) {
    const [mode, setMode] = useState("influx-login");
    const [formData, setFormData] = useState({
        influxToken: "",
        influxOrg: "",
        grafanaToken: "",
        grafanaOrgId: "",
    });
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            let url = "";
            let body = {};

            if (mode === "influx-login") {
                url = "http://localhost:5001/api/auth/login/influx";
                body = {
                    influxToken: formData.influxToken,
                    influxOrg: formData.influxOrg,
                };
            } else if (mode === "grafana-login") {
                url  = "http://localhost:5001/api/auth/login/grafana";
                body = {
                    grafanaToken: formData.grafanaToken,
                    grafanaOrgId: formData.grafanaOrgId,
                };
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                credentials: "include",
            });

            const data = await res.json();

            console.log("Login response:", data);
            if (res.ok) {
                sessionStorage.setItem("accessToken", data.accessToken);
                setMessage("Login successful!");
                window.location.reload();
            } else {
                setMessage(data.error || data.message || "Login failed");
            }
        } catch (error) {
            console.error(error);
            setMessage("Server error, please try again");
        }
    };

    const renderForm = () => {

        if (mode === "influx-login") {
            return (
                <form onSubmit={handleLogin} className="auth-form">
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
                            placeholder="Leave empty to use default"
                        />
                    </div>

                    <button type="submit" className="btn-auth">
                        Log In
                    </button>
                </form>
            );
            }

            if (mode === "grafana-login") {
                return (
                    <form onSubmit={handleLogin} className="auth-form">
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
                        <button type="submit" className="btn-auth">
                            Log In
                        </button>
                    </form>
                );
        }
    }


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <button className="modal-close" onClick={onClose}>
                x
                </button>

                <h2>
                    {mode === "grafana-login" ? "Login with Grafana" : "Login with InfluxDB"}
                </h2>

                {renderForm()}

                <div>{message && <p className="auth-message">{message}</p>}</div>

                <div className="divider">or</div>

                <div className="oauth-buttons">
                    {mode === "grafana-login" ?
                    (<button className="btn-oauth influx" onClick={() => setMode("influx-login")}>
                        <img src={influxLogo} alt="InfluxDB" className="oauth-logo" />
                        Log in with InfluxDB
                    </button>)
                    :
                    (<button className="btn-oauth grafana" onClick={() => setMode("grafana-login")}>
                        <img src={grafanaLogo} alt="Grafana" className="oauth-logo" />
                        Log in with Grafana
                    </button>)
                    }
                </div>
            </div>
    </div>
    );
}