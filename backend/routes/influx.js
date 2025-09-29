const express = require('express');
const router = express.Router();
const { InfluxDB } = require('@influxdata/influxdb-client');
const { BucketsAPI } = require('@influxdata/influxdb-client-apis');
const authMiddleware = require('../middleware/authMiddleware');


const getClientFromUser = (user) => {
  if (!user) return null;

  const { influxToken, influxUrl, influxOrg } = user;
  if (!influxUrl || !influxToken) return null;

  const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
  const bucketsAPI = new BucketsAPI(influxDB);

  return { influxDB, bucketsAPI, org: influxOrg };
};

// List measurements for a bucket (no time filter; robust row parsing)
router.get('/measurements/:bucket', authMiddleware, async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const client = getClientFromUser(req.user);

    if (!client){
      console.error("Buckets route missing client", {client});
      return res.status(400).json({ error: "No Influx client available" });
    }

    const queryApi = client.influxDB.getQueryApi(client.org);
    const query = `
      import "influxdata/influxdb/schema"
      schema.measurements(bucket: "${bucket}")
      |> sort()
    `;

    const rows = await queryApi.collectRows(query); // returns array of objects
    // Row objects can expose the measurement name under _value (typical) or measurement
    const measurements = rows
      .map(r => r._value || r.measurement || r._measurement)
      .filter(Boolean)
      .map(name => ({ name, id: name }));

    if (measurements.length === 0) {
      const fallbackQuery = `
        from(bucket: "${bucket}")
          |> range(start: -10y)
          |> keep(columns: ["_measurement"])
          |> distinct(column: "_measurement")
          |> sort()
      `;
      const fbRows = await queryApi.collectRows(fallbackQuery);
      fbRows.forEach(r => {
        const name = r._measurement || r._value;
        if (name) measurements.push({ name, id: name });
      });
    }

    res.json({ measurements });

  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Failed to fetch measurements'});
  }
});


// Fields/Tags for a measurement (robust row parsing)
router.get('/fields/:bucket/:measurement', authMiddleware, async (req, res) => {
  try {
    const { bucket, measurement } = req.params;
    const client = getClientFromUser(req.user);

    if (!client) {
      return res.status(500).json({ error: 'Influx not configured' });
    }

    const queryApi = client.influxDB.getQueryApi(client.org);

    const fieldQuery = `
      import "influxdata/influxdb/schema"
      schema.measurementFieldKeys(bucket: "${bucket}", measurement: "${measurement}")
      |> sort()
    `;
    const tagQuery = `
      import "influxdata/influxdb/schema"
      schema.measurementTagKeys(bucket: "${bucket}", measurement: "${measurement}")
      |> sort()
    `;

    const [fieldRows, tagRows] = await Promise.all([
      queryApi.collectRows(fieldQuery),
      queryApi.collectRows(tagQuery),
    ]);

    const fields = fieldRows
      .map(r => r.fieldKey || r._value || r._field)
      .filter(Boolean)
      .map(name => ({ type: 'FIELD', name }));

    const tags = tagRows
      .map(r => r.tagKey || r._value)
      .filter(Boolean)
      .map(name => ({ type: 'TAG', name }));

    res.json([...fields, ...tags]);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields'});
  }
});

// Add /buckets route so frontend can fetch available buckets
router.get('/buckets', authMiddleware, async (req, res) => {

  console.log("Buckets req.user", req.user);

  try {
    const client = getClientFromUser(req.user);
    // const org = client.org;

    if (!client){
      console.error("Buckets route missing client", {client});
    }

    console.log("/buckets route hit with org", client.org);

    const bucketsAPI = client.bucketsAPI;
    const response = await bucketsAPI.getBuckets({org: client.org});
    console.log("Buckets API raw response:", response);
    const buckets = (response?.buckets || []).map(b => ({id: b.id, name: b.name,}));
    res.json(buckets);

  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({ error: 'Failed to fetch buckets', details: error.message});
  }
});

// Execute a flux query and return results
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    const client = getClientFromUser(req.user);
    if (!client) {
      return res.status(400).json({ error: 'No InfluxDB client available' });
    }

    const queryApi = client.influxDB.getQueryApi(client.org);
    const result = await queryApi.collectRows(query);
    
    res.json({ results: result });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query', details: error.message });
  }
});

module.exports = router;
