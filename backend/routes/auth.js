const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken')
const {createInfluxClient} = require('../utils/influx.config');

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

        // verify credentials by fetching buckets
        const buckets = await bucketsAPI.getBuckets({ org });
        console.log("Buckets fetched:", buckets?.buckets?.length);

        const token = jwt.sign(
            {
                influxToken,
                influxUrl: influxUrl || process.env.INFLUX_URL,
                influxOrg: influxOrg || process.env.INFLUX_ORG
            },
            process.env.JWT_SECRET,
            {expiresIn: "1h"},
        );

        res.json({ success: true, token, buckets });

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

        let orgData = {};
        try {
            orgData = await orgRes.json();
        } catch (err) {
            orgData = {};
        }


        const token = jwt.sign(
            {grafanaToken, org: orgData},
            process.env.JWT_SECRET,
            {expiresIn: "1h"},
        );


        res.json({success:true, token, orgData});

    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Grafana auth failed", details: err.message});
    }
});

module.exports = {router};