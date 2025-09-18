require('dotenv').config();

const { InfluxDB } = require('@influxdata/influxdb-client');
const { BucketsAPI } = require('@influxdata/influxdb-client-apis');

/**
 * Creates a new InfluxDB client and APIs.
 * If no args are provided, falls back to .env defaults.
 *
 * @param {object} opts
 * @param {string} opts.url
 * @param {string} opts.token
 * @param {string} [opts.org]
 */

function createInfluxClient(opts={}){
  const url = opts.url || process.env.INFLUX_URL;
  const token = opts.token || process.env.INFLUX_TOKEN;
  const org = opts.org || process.env.INFLUX_ORG;

  if (!url || !token) {
    throw new Error('Influx client requires url and token');
  }

  const influxDB = new InfluxDB({url, token});
  const bucketsAPI = new BucketsAPI(influxDB);

  return {influxDB, org, bucketsAPI};
}

module.exports = { createInfluxClient };
