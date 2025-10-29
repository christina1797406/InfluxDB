const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Influx client SDKs used inside the route
jest.mock('@influxdata/influxdb-client', () => ({
  InfluxDB: jest.fn(() => ({
    getQueryApi: jest.fn(() => ({
      collectRows: jest.fn(async (q) => {
        if (String(q).includes('schema.measurements')) {
          return [{ _value: 'cpu' }, { _value: 'mem' }];
        }
        if (String(q).includes('measurementFieldKeys')) {
          return [{ _value: 'usage' }, { fieldKey: 'temp' }];
        }
        if (String(q).includes('measurementTagKeys')) {
          return [{ _value: 'host' }, { tagKey: 'region' }];
        }
        if (String(q).includes('schema.tagValues')) {
          return [{ _value: 'server-1' }, { _value: 'server-2' }];
        }
        // generic query
        return [{ _time: 't', _value: 1 }];
      })
    }))
  }))
}));

jest.mock('@influxdata/influxdb-client-apis', () => ({
  BucketsAPI: jest.fn(function () {
    this.getBuckets = jest.fn(async () => ({ buckets: [{ id: 'b1', name: 'bucket1' }] }));
  })
}));

let app;
const makeToken = (overrides = {}) =>
  jwt.sign({ influxToken: 'tok', influxUrl: 'http://i', influxOrg: 'org', ...overrides }, process.env.JWT_SECRET);

beforeAll(() => {
  app = require('../index');
});

describe('/api/influx routes', () => {
  test('GET /buckets returns list with auth', async () => {
    const token = makeToken();
    const res = await request(app).get('/api/influx/buckets').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: 'b1', name: 'bucket1' });
  });

  test('GET /measurements/:bucket returns measurement names', async () => {
    const token = makeToken();
    const res = await request(app).get('/api/influx/measurements/test').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.measurements.map(m => m.name)).toEqual(['cpu', 'mem']);
  });

  test('GET /fields/:bucket/:measurement returns fields and tags', async () => {
    const token = makeToken();
    const res = await request(app).get('/api/influx/fields/b/testm').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const types = res.body.map(x => x.type);
    expect(types).toContain('FIELD');
    expect(types).toContain('TAG');
  });

  test('POST /query executes and returns results + tookMs', async () => {
    const token = makeToken();
    const res = await request(app).post('/api/influx/query').set('Authorization', `Bearer ${token}`).send({ query: 'from(bucket:"b") |> range(start:-1h)' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(typeof res.body.tookMs).toBe('number');
  });

  test('GET /tag-values/:bucket/:measurement/:tagKey returns values (filterable)', async () => {
    const token = makeToken();
    const res = await request(app).get('/api/influx/tag-values/b/testm/host?q=server-1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.values).toEqual(['server-1']);
  });
});


