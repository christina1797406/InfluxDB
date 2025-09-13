// making sure that env vars are loaded when this module is required
require('dotenv').config();

const { InfluxDB } = require('@influxdata/influxdb-client');
const { BucketsAPI } = require('@influxdata/influxdb-client-apis');

// just for a cleaner look
const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG;

if (!INFLUX_URL || !INFLUX_TOKEN) {
  console.warn('Warning: INFLUX_URL or INFLUX_TOKEN not set. Influx client may not be configured.');
}

const influxDB = new InfluxDB({
  url: INFLUX_URL,
  token: INFLUX_TOKEN,
});

const org = INFLUX_ORG;
const bucketsAPI = new BucketsAPI(influxDB);

module.exports = { influxDB, org, bucketsAPI };
