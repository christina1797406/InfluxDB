const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../utils/influx.config', () => ({
  createInfluxClient: jest.fn(() => ({
    bucketsAPI: { getBuckets: jest.fn(async () => ({ buckets: [{ id: 'b1', name: 'bucket1' }] })) },
    org: 'test-org',
  })),
}));

let app;

beforeAll(() => {
  app = require('../index');
});

describe('/api/auth routes', () => {
  describe('POST /api/auth/login/influx', () => {
    test('400 when missing influxToken', async () => {
      const res = await request(app).post('/api/auth/login/influx').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns accessToken on valid token', async () => {
      const res = await request(app).post('/api/auth/login/influx').send({ influxToken: 'tok', influxUrl: 'http://localhost', influxOrg: 'org' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({ influxToken: 'tok', influxUrl: 'http://localhost', influxOrg: 'org' });
    });
  });

  describe('POST /api/auth/login/grafana', () => {
    test('400 when missing grafana token', async () => {
      const res = await request(app).post('/api/auth/login/grafana').send({});
      expect(res.status).toBe(400);
    });

    test('401 when Grafana rejects', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'unauthorized' });
      const res = await request(app).post('/api/auth/login/grafana').send({ grafanaToken: 'abc', grafanaUrl: 'http://g', grafanaOrgId: '1' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('200 when Grafana accepts', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ([]) });
      const res = await request(app).post('/api/auth/login/grafana').send({ grafanaToken: 'abc', grafanaUrl: 'http://g', grafanaOrgId: '1' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('401 when missing refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});
      expect(res.status).toBe(401);
    });
  });
});


