const express = require('express');
const router = express.Router();
const { InfluxDB } = require('@influxdata/influxdb-client');


const getClientFromUser = (req) => {
  const influxToken = req.user?.influxToken;
  const influxUrl = process.env.INFLUX_URL;
  if (!influxUrl || !influxToken) return null;
  return new InfluxDB({ url: influxUrl, token: influxToken });
};

// List measurements for a bucket (no time filter; robust row parsing)
router.get('/measurements/:bucket', async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const client = getClientFromUser(req);
    const org = process.env.INFLUX_ORG;

    if (!client || !org) {
      return res.status(500).json({ error: 'Influx not configured' });
    }

    const queryApi = client.getQueryApi(org);
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
router.get('/fields/:bucket/:measurement', async (req, res) => {
  try {
    const { bucket, measurement } = req.params;
    const client = getClientFromUser(req);
    const org = process.env.INFLUX_ORG;

    if (!client || !org) {
      return res.status(500).json({ error: 'Influx not configured' });
    }

    const queryApi = client.getQueryApi(org);

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
router.get('/buckets', async (req, res) => {
  try {
    const client = getClientFromUser(req);
    const org = process.env.INFLUX_ORG;

    if (!client || !org) {
      return res.status(500).json({ error: 'Influx not configured' });
    }

    console.log('/buckets route hit');

    const bucketsAPI = client.getBucketsApi();
    const response = await bucketsAPI.getBuckets({org});
    const buckets = (response?.buckets || []).map(b => ({id: b.id, name: b.name,}));
    res.json(buckets);

  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({ error: 'Failed to fetch buckets'});
  }
});

module.exports = router;
