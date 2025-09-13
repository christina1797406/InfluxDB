const express = require('express');
const router = express.Router();
const { InfluxDB } = require('@influxdata/influxdb-client');
const { influxDB, org, bucketsAPI } = require('../utils/influx.config');

const getClientFromEnvIfNeeded = () => {
  if (influxDB) return influxDB;
  const url = process.env.INFLUX_URL;
  const token = process.env.INFLUX_TOKEN;
  if (url && token) {
    console.log('Creating InfluxDB client from env variables');
    return new InfluxDB({ url, token });
  }
  return null;
};

router.get('/measurements/:bucket', async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const client = getClientFromEnvIfNeeded();
    if (!client) {
      console.error('Influx client is not configured (no exported client and missing env vars)');
      return res.status(500).json({ message: 'Influx client not configured' });
    }

    const orgToUse = org || process.env.INFLUX_ORG;
    if (!orgToUse) {
      console.error('Influx org not set (org and INFLUX_ORG missing)');
      return res.status(500).json({ message: 'Influx org not configured' });
    }

    const queryApi = client.getQueryApi(orgToUse);

    console.log('Fetching measurements for bucket:', bucket);

    const query = `
      from(bucket: "${bucket}")
        |> range(start: -1y)
        |> distinct(column: "_measurement")
        |> sort()
    `;

    const measurements = [];
    for await (const record of queryApi.iterateRows(query)) {
      // record may contain .values array; use defensive access
      const name = record?.values && record.values[0] ? record.values[0] : null;
      if (name) {
        console.log('Found measurement:', name);
        measurements.push({ name, id: name });
      }
    }

    console.log('Final measurements:', measurements);
    res.json({ measurements });
  } catch (error) {
    console.error('Error details:', { message: error?.message, stack: error?.stack });
    res.status(500).json({ message: 'Failed to fetch measurements', error: error?.message });
  }
});

router.get('/fields/:bucket/:measurement', async (req, res) => {
  try {
    const { bucket, measurement } = req.params;
    const queryApi = influxDB.getQueryApi(org);
    
    const query = `
      import "influxdata/influxdb/schema"
      schema.measurementFieldKeys(
        bucket: "${bucket}",
        measurement: "${measurement}"
      )
    `;
    
    const fields = [];
    for await (const {values} of queryApi.iterateRows(query)) {
      fields.push({ type: 'FIELD', name: values[0] });
    }
    
    const tagQuery = `
      import "influxdata/influxdb/schema"
      schema.measurementTagKeys(
        bucket: "${bucket}",
        measurement: "${measurement}"
      )
    `;
    
    const tags = [];
    for await (const {values} of queryApi.iterateRows(tagQuery)) {
      tags.push({ type: 'TAG', name: values[0] });
    }
    
    res.json([...fields, ...tags]);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ message: 'Failed to fetch fields' });
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
