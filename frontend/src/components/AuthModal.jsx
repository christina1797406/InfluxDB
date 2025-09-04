import { useState } from "react";
import grafanaLogo from "../images/grafana-logo.png";
import influxLogo from "../images/influxdb-logo.png";
import "../styles/Auth.css";

export default function AuthModal({isOpen, onClose}) {
    const [mode, setMode] = useState("login");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`${mode} data:`, formData);
    // call backend API depending on mode
    // POST /api/auth/login or POST /api/auth/signup
    onClose();
    };

    if (!isOpen) return null;

    return (
    <div className="modal-overlay">
        <div className="modal">
        <button className="modal-close" onClick={onClose}>x</button>

        <h2>{mode === "login" ? "Log In" : "Sign Up"}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
            {mode === "signup" && (
                <div className="form-group">
                <label>Username</label>
                <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                />
                </div>
            )}

            <div className="form-group">
            <label>Email</label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
            />
            </div>

            <div className="form-group">
            <label>Password</label>
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
            />
            </div>

            <button type="submit" className="btn-primary">
                {mode === "login" ? "Log In" : "Sign Up"}
            </button>
        </form>

        <div className="divider">
            or
        </div>

        <div className="oauth-buttons">
            <button className="btn-oauth influx">
                <img src={influxLogo} alt="InfluxDB" className="oauth-logo" />
                Log in with InfluxDB
            </button>
            <button className="btn-oauth grafana">
                <img src={grafanaLogo} alt="Grafana" className="oauth-logo" />
                Log in with Grafana
            </button>
        </div>

        <p className="switch-text">
            {mode === "login" ? (
                <>
                <span className="switch-account">Don’t have an account?{" "}</span>
                <span onClick={() => setMode("signup")} className="switch-link">
                    Sign up here
                </span>
                </>
            ) : (
                <>
                <span className="switch-account">Already have an account?{" "}</span>
                <span onClick={() => setMode("login")} className="switch-link">
                    Log in here
                </span>
                </>
            )}
            </p>
        </div>
        </div>
    );
}