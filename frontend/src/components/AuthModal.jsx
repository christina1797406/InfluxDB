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
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(`${mode} data:`, formData);
        setMessage("");

        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
            const res = await fetch(`http://localhost:5001${endpoint}`,{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: formData.email, password: formData.password}),
            });

            const data = await res.json();
            // localStorage.setItem('token', data.token);

            if (res.ok) {
                if (mode === "login") {
                    localStorage.setItem("token", data.token);
                    setMessage("Login successful!");
                } else {
                    setMessage("Account created!");
                }
                // onClose();
                window.location.reload();
            } else {
                setMessage("❌ " + data.msg)
            }
        } catch (error) {
            console.error(error);
            setMessage("Server error, please try again.");
        }
        // onClose();
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

            <button type="submit" className="btn-auth">
                {mode === "login" ? "Log In" : "Sign Up"}
            </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

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