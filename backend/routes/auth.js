const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken')
const {createInfluxClient} = require('../utils/influx.config');

const ACCESS_TOKEN_EXP = "1h";
const REFRESH_TOKEN_EXP = "7d";

function generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXP,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXP,
    });
    return { accessToken, refreshToken };
}

// LOGIN WITH INFLUXDB
router.post('/login/influx', async(req,res)=>{
    const {influxToken, influxUrl, influxOrg} = req.body;

    if (!influxToken) {
        console.log("Missing InfluxDB token");
        return res.status(400).json({error: "Missing InfluxDB token!"});
    }

    try {
        // create client with user’s credentials
        const { bucketsAPI, org } = createInfluxClient({
            url: influxUrl,
            token: influxToken,
            org: influxOrg,
        });
        await bucketsAPI.getBuckets({org});

        const payload = {
            influxToken,
            influxUrl: influxUrl || process.env.INFLUX_URL,
            influxOrg: influxOrg || process.env.INFLUX_ORG,
        };

        const { accessToken, refreshToken } = generateTokens(payload);

        // store refresh token in secure HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, accessToken });

    } catch (err) {
        console.error(err);
        res.status(401).json({ success: false, message: 'Invalid Influx credentials' });
    }
});


// LOGIN WITH GRAFANA
router.post('/login/grafana', async (req, res) => {
    const { grafanaToken, grafanaOrgId } = req.body;

    if (!grafanaToken){
        return res.status(400).json({ error: "Missing Grafana token or orgId!" });
    }

    try {
        const grafanaUrl = process.env.GRAFANA_URL;
        const orgIdHeader = grafanaOrgId ? { "X-Grafana-Org-Id": grafanaOrgId } : {};
        const orgRes = await fetch(`${grafanaUrl}/api/org`, {
            headers: {Authorization: `Bearer ${grafanaToken}`,...orgIdHeader},
        });
        if (!orgRes.ok){
            const errData = await orgRes.text();
            return res.status(401).json({error: "Cannot fetch orgs for token", details: errData});
        }

        const orgData = await orgRes.json().catch(() => ({}));

        const payload = { grafanaToken, org: orgData };
        const { accessToken, refreshToken } = generateTokens(payload);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, accessToken, orgData });

    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Grafana auth failed", details: err.message});
    }
});

router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: "Missing refresh token" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const { accessToken, refreshToken: newRefresh } = generateTokens(decoded);

        res.cookie("refreshToken", newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, accessToken });
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});


router.post("/logout", (req, res) => {
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out" });
});

module.exports = {router};