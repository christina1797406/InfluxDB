const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken')
const { createInfluxClient } = require('../utils/influx.config');

const ACCESS_TOKEN_EXP = "1h";
const REFRESH_TOKEN_EXP = "7d";

function stripJwtClaims(obj = {}) {
    const { exp, iat, nbf, iss, aud, sub, ...rest } = obj;
    return rest;
}

function generateTokens(payload) {
    const safe = stripJwtClaims(payload);
    const accessToken = jwt.sign(safe, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXP });
    const refreshToken = jwt.sign(safe, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXP });
    return { accessToken, refreshToken };
}

// helper: merge with existing jwt payload if provided (so we keep both influx + grafana creds)
// note: we only trust tokens signed by our server; if invalid, we just ignore and start fresh
function getExistingPayload(req) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return {};
    const token = auth.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return stripJwtClaims(decoded);
    } catch {
        return {};
    }
}

// LOGIN WITH INFLUXDB
router.post('/login/influx', async (req, res) => {
    const { influxToken, influxUrl, influxOrg } = req.body;

    if (!influxToken) {
        return res.status(400).json({ error: "Missing InfluxDB token!" });
    }

    try {
        // create client with user’s credentials (verify token works)
        const { bucketsAPI, org } = createInfluxClient({
            url: influxUrl || process.env.INFLUX_URL,
            token: influxToken,
            org: influxOrg || process.env.INFLUX_ORG,
        });
        await bucketsAPI.getBuckets({ org });

        // merge with existing payload (so later grafana login adds on top, not overwrite)
        const existing = getExistingPayload(req);
        const payload = {
            ...existing,
            influxToken,
            influxUrl: influxUrl || process.env.INFLUX_URL,
            influxOrg: influxOrg || process.env.INFLUX_ORG,
        };

        const { accessToken, refreshToken } = generateTokens(payload);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, accessToken });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid Influx credentials' });
    }
});


// LOGIN WITH GRAFANA
router.post('/login/grafana', async (req, res) => {
    const { grafanaToken: rawToken, grafanaOrgId, grafanaUrl: grafUrlBody } = req.body;

    if (!rawToken) {
        return res.status(400).json({ error: "Missing Grafana token!" });
    }

    try {
        const grafanaUrl = (grafUrlBody || process.env.GRAFANA_URL || "").trim().replace(/\/+$/, "");
        if (!grafanaUrl) {
            return res.status(500).json({ error: "Missing GRAFANA_URL (set in backend/.env or provide grafanaUrl in request body)" });
        }
        const token = rawToken.replace(/^Bearer\s+/i, "").trim();
        const orgHeader = grafanaOrgId ? { "X-Grafana-Org-Id": String(grafanaOrgId) } : {};

        // Validate token by listing datasources (requires Editor/Admin)
        const dsRes = await fetch(`${grafanaUrl}/api/datasources`, {
            headers: { Authorization: `Bearer ${token}`, ...orgHeader },
        });

        if (!dsRes.ok) {
            const detail = await dsRes.text().catch(() => "");
            return res.status(dsRes.status === 401 || dsRes.status === 403 ? 401 : 502).json({
                error: "Grafana token not authorized (need Editor/Admin). Do not include 'Bearer ' prefix.",
                details: detail
            });
        }

        // merge with existing payload (keep influx creds too)
        const existing = getExistingPayload(req);
        const payload = {
            ...existing,
            grafanaToken: token,
            grafanaOrgId: grafanaOrgId || existing.grafanaOrgId || "1",
            grafanaUrl,
        };

        const { accessToken, refreshToken } = generateTokens(payload);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, accessToken });
    } catch (err) {
        res.status(500).json({ error: "Grafana auth failed", details: err.message });
    }
});

router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: "Missing refresh token" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const { accessToken, refreshToken: newRefresh } = generateTokens(stripJwtClaims(decoded));

        res.cookie("refreshToken", newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, accessToken });
    } catch {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out" });
});

module.exports = { router };