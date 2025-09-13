const express = require('express');
const router = express.Router();
const { InfluxDB } = require('@influxdata/influxdb-client');
const { influxDB, org, bucketsAPI } = require('../utils/influx.config');

const getClientFromEnvIfNeeded = () => {
  if (influxDB) return influxDB;
  const url = process.env.INFLUX_URL;
  const token = process.env.INFLUX_TOKEN;
  if (url && token) return new InfluxDB({ url, token });
  return null;
};

// List measurements for a bucket (no time filter; robust row parsing)
router.get('/measurements/:bucket', async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const client = getClientFromEnvIfNeeded();
    const orgToUse = org || process.env.INFLUX_ORG;

    if (!client || !orgToUse) {
      return res.status(500).json({ message: 'Influx not configured' });
    }

    const queryApi = client.getQueryApi(orgToUse);

    // Use schema.measurements to avoid time windows
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

    // Fallback: if empty (older servers), try distinct over a wide range
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
    res.status(500).json({ message: 'Failed to fetch measurements', error: error?.message });
  }
});

// Fields/Tags for a measurement (robust row parsing)
router.get('/fields/:bucket/:measurement', async (req, res) => {
  try {
    const { bucket, measurement } = req.params;
    const client = getClientFromEnvIfNeeded();
    const orgToUse = org || process.env.INFLUX_ORG;

    if (!client || !orgToUse) {
      return res.status(500).json({ message: 'Influx not configured' });
    }

    const queryApi = client.getQueryApi(orgToUse);

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
    res.status(500).json({ message: 'Failed to fetch fields', error: error?.message });
  }
});

// Add /buckets route so frontend can fetch available buckets
router.get('/buckets', async (req, res) => {
  try {
    console.log('/buckets route hit');
    const response = await bucketsAPI.getBuckets({ org });
    const buckets = (response?.buckets || []).map(b => ({
      id: b.id,
      name: b.name
    }));
    res.json(buckets);
  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({ message: 'Failed to fetch buckets', error: error?.message });
  }
});

module.exports = router;
