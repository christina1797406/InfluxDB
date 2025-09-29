const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// Build Flux from the builder state coming from the UI
function buildFluxFromState(state) {
  const {
    bucket,
    measurement,
    fields = [], // [{type:'FIELD'|'TAG', name}]
    filters = [], // [{fieldType, fieldName, operator, value, logicAfter}]
    windowEvery = '1m',
    aggregate = 'mean',
    timePreset = 'Last 1h',
    timeFrom,
    timeTo,
  } = state || {};

  // time range
  const presetToRange = (p) => {
    const map = {
      'Last 5m': '-5m', 'Last 15m': '-15m', 'Last 30m': '-30m',
      'Last 1h': '-1h', 'Last 6h': '-6h', 'Last 12h': '-12h',
      'Last 24h': '-24h', 'Last 7d': '-7d', 'Last 30d': '-30d',
    };
    return map[p] || '-1h';
  };

  const rangeLine = timePreset === 'Custom' && timeFrom && timeTo
    ? `|> range(start: ${JSON.stringify(timeFrom)}, stop: ${JSON.stringify(timeTo)})`
    : `|> range(start: ${presetToRange(timePreset)})`;

  // filters
  const measFilter = measurement
    ? `|> filter(fn: (r) => r._measurement == ${JSON.stringify(measurement)})`
    : '';

  const filterParts = (filters || []).map((f, idx) => {
    const op = f.operator || '=';
    const value = (op === 'regex')
      ? new RegExp(f.value || '').toString()
      : JSON.stringify(f.value ?? '');
    const col = f.fieldType === 'FIELD' ? '_field' : f.fieldName; // TAG uses its tag key
    const expr = op === 'regex'
      ? `r.${col} =~ ${value}`
      : op === 'contains' || op === '!contains'
        ? `${op === 'contains' ? '' : '!'}contains(value: r.${col}, set: [${JSON.stringify(f.value || '')}])`
        : `r.${col} ${op} ${value}`;

    const logic = idx > 0 ? (filters[idx - 1].logicAfter || 'AND') : '';
    return { logic, expr };
  });

  let filterLine = '';
  if (filterParts.length) {
    // Combine with AND/OR
    const where = filterParts.reduce((acc, cur, i) => {
      const seg = `(${cur.expr})`;
      if (i === 0) return seg;
      return `${acc} ${cur.logic === 'OR' ? 'or' : 'and'} ${seg}`;
    }, '');
    filterLine = `|> filter(fn: (r) => ${where})`;
  }

  // keep only selected FIELDS if provided
  const selectedFieldNames = (fields || [])
    .filter(f => f.type === 'FIELD')
    .map(f => f.name);
  const keepFields = selectedFieldNames.length
    ? `|> filter(fn: (r) => r._field =~ /${selectedFieldNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}/)`
    : '';

  const windowLine = windowEvery ? `|> aggregateWindow(every: ${windowEvery}, fn: ${aggregate || 'mean'}, createEmpty: false)` : '';
  const sortLine = '|> sort(columns: ["_time"])';

  return [
    `from(bucket: ${JSON.stringify(bucket)})`,
    rangeLine,
    measFilter,
    keepFields,
    filterLine,
    windowLine,
    sortLine,
  ].filter(Boolean).join('\n  ');
}

// Ensure a Grafana InfluxDB v2 data source for the current user (uses req.user.*)
router.post('/datasource/ensure', auth, async (req, res) => {
  try {
    const grafanaUrl = (req.user?.grafanaUrl || process.env.GRAFANA_URL || "").trim().replace(/\/+$/, "");
    if (!grafanaUrl) return res.status(500).json({ error: 'Missing GRAFANA_URL' });

    const { grafanaToken, influxUrl, influxToken, influxOrg } = req.user || {};
    if (!grafanaToken) return res.status(401).json({ error: 'Not logged in with Grafana' });
    if (!influxUrl || !influxToken || !influxOrg) return res.status(400).json({ error: 'Missing Influx connection in JWT' });

    const name = `InfluxDB v2 - ${influxOrg}`;

    // find by name
    const dsRes = await fetch(`${grafanaUrl}/api/datasources/name/${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${grafanaToken}` },
    });

    let ds;
    if (dsRes.ok) {
      ds = await dsRes.json();
      // Update to ensure settings are correct
      const updateRes = await fetch(`${grafanaUrl}/api/datasources/${ds.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${grafanaToken}`,
        },
        body: JSON.stringify({
          name,
          type: 'influxdb',
          access: 'proxy',
          url: influxUrl,
          jsonData: {
            version: 'Flux',
            organization: influxOrg,
            defaultBucket: req.body.defaultBucket || undefined,
            httpMode: 'POST',
          },
          secureJsonData: { token: influxToken },
        }),
      });
      if (!updateRes.ok) {
        const t = await updateRes.text();
        return res.status(502).json({ error: 'Failed to update datasource', details: t });
      }
      ds = await (await fetch(`${grafanaUrl}/api/datasources/name/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${grafanaToken}` },
      })).json();
      return res.json({ ok: true, datasource: ds });
    }

    // create
    const createRes = await fetch(`${grafanaUrl}/api/datasources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grafanaToken}`,
      },
      body: JSON.stringify({
        name,
        type: 'influxdb',
        access: 'proxy',
        url: influxUrl,
        jsonData: {
          version: 'Flux',
          organization: influxOrg,
          defaultBucket: req.body.defaultBucket || undefined,
          httpMode: 'POST',
        },
        secureJsonData: { token: influxToken },
      }),
    });
    if (!createRes.ok) {
      const t = await createRes.text();
      return res.status(502).json({ error: 'Failed to create datasource', details: t });
    }
    const created = await createRes.json();
    return res.json({ ok: true, datasource: created });
  } catch (e) {
    console.error('ensure datasource error', e);
    res.status(500).json({ error: 'Datasource ensure failed', details: e.message });
  }
});

// Create/update dashboard
router.post('/dashboards/export', auth, async (req, res) => {
  try {
    const grafanaUrl = (req.user?.grafanaUrl || process.env.GRAFANA_URL || "").trim().replace(/\/+$/, "");
    if (!grafanaUrl) return res.status(500).json({ error: 'Missing GRAFANA_URL' });
    const { grafanaToken, influxOrg } = req.user || {};
    if (!grafanaToken) return res.status(401).json({ error: 'Not logged in with Grafana' });

    // ensure datasource first
    const ensure = await fetch(`${grafanaUrl}/api/datasource/uid`, { headers: { Authorization: `Bearer ${grafanaToken}` } }).catch(() => null);
    // above call only to check API; real ensure below:
    const ensureRes = await fetch(`${req.protocol}://${req.get('host')}/api/grafana/datasource/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: JSON.stringify({ defaultBucket: req.body?.builderState?.bucket }),
    });
    const ensureJson = await ensureRes.json();
    if (!ensureRes.ok) return res.status(ensureRes.status).json(ensureJson);
    const ds = ensureJson.datasource;
    const dsUid = ds?.uid || ds?.datasource?.uid;

    // Build Flux
    const flux = req.body.flux || buildFluxFromState(req.body.builderState || {});
    const title = req.body.title || `Influx ${influxOrg} Dashboard`;
    const panelTitle = req.body.panelTitle || 'Influx Panel';

    const dashboard = {
      title,
      uid: undefined, // let Grafana assign
      timezone: 'browser',
      time: { from: 'now-1h', to: 'now' },
      panels: [
        {
          id: 1,
          title: panelTitle,
          type: 'timeseries',
          gridPos: { x: 0, y: 0, w: 24, h: 8 },
          datasource: { type: 'influxdb', uid: dsUid },
          targets: [
            {
              refId: 'A',
              query: flux,
              queryType: 'flux',
              datasource: { type: 'influxdb', uid: dsUid },
            },
          ],
          options: {
            legend: { displayMode: 'list', placement: 'bottom' },
          },
          fieldConfig: { defaults: {}, overrides: [] },
        },
      ],
    };

    const resp = await fetch(`${grafanaUrl}/api/dashboards/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grafanaToken}` },
      body: JSON.stringify({ dashboard, folderId: req.body.folderId || 0, overwrite: true }),
    });

    const out = await resp.json().catch(() => ({}));
    if (!resp.ok) return res.status(502).json({ error: 'Failed to create dashboard', details: out });

    res.json({
      ok: true,
      url: out?.url ? `${grafanaUrl}${out.url}` : undefined,
      uid: out?.uid || out?.dashboard?.uid,
      slug: out?.slug,
    });
  } catch (e) {
    console.error('export dashboard error', e);
    res.status(500).json({ error: 'Export failed', details: e.message });
  }
});

module.exports = router;