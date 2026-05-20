// Custom Views: read-only aggregations for visual dashboards.
// Backed by existing ot_assets / network_zones / protocol_anomalies tables.

const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Map a free-form purdue_level token ("L0".."L5", "L3.5", "0", "Level 1", ...)
// to a Purdue level number 0..4. Anything Level 3.5+ (DMZ + enterprise + internet)
// is folded into the Enterprise layer (4) for visualization purposes.
function normalizePurdue(level) {
  if (level == null) return 4;
  const s = String(level).toLowerCase().replace(/[^0-9.]/g, '');
  if (!s) return 4;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 4;
  if (n <= 0.5) return 0;
  if (n <= 1.5) return 1;
  if (n <= 2.5) return 2;
  if (n <= 3.5) return 3;
  return 4;
}

const PURDUE_LAYERS = [
  { level: 0, name: 'Field Devices',   description: 'Sensors, actuators, instrumentation' },
  { level: 1, name: 'Process Control', description: 'PLCs, RTUs, IEDs' },
  { level: 2, name: 'Supervisory',     description: 'HMIs, SCADA, control servers' },
  { level: 3, name: 'Site Operations', description: 'Historians, MES, engineering WS' },
  { level: 4, name: 'Enterprise',      description: 'IT, DMZ, business networks' },
];

// GET /api/custom-views/purdue-network
// Returns 5 Purdue layers, each with the OT assets that belong to it
// (joined to a network_zone by zone name → purdue_level).
router.get('/purdue-network', async (req, res) => {
  try {
    const assetsQ = await pool.query(`
      SELECT a.id, a.asset_id, a.type, a.vendor, a.model, a.criticality, a.zone,
             z.purdue_level AS zone_purdue_level, z.name AS zone_name
      FROM ot_assets a
      LEFT JOIN network_zones z ON LOWER(z.name) = LOWER(a.zone)
      ORDER BY a.id ASC
    `);

    const layers = PURDUE_LAYERS.map((l) => ({ ...l, assets: [] }));
    for (const row of assetsQ.rows) {
      // Prefer the joined zone's purdue_level. Fallback by asset type heuristic.
      let purdue;
      if (row.zone_purdue_level) {
        purdue = normalizePurdue(row.zone_purdue_level);
      } else {
        const t = String(row.type || '').toLowerCase();
        if (t.includes('sensor') || t.includes('actuator')) purdue = 0;
        else if (t.includes('plc') || t.includes('rtu') || t.includes('safety')) purdue = 1;
        else if (t.includes('hmi') || t.includes('scada')) purdue = 2;
        else if (t.includes('historian') || t.includes('engineering')) purdue = 3;
        else purdue = 4;
      }
      layers[purdue].assets.push({
        id: row.id,
        asset_id: row.asset_id,
        type: row.type,
        vendor: row.vendor,
        model: row.model,
        criticality: row.criticality,
        zone: row.zone,
        zone_purdue_level: row.zone_purdue_level,
      });
    }
    res.json(layers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/custom-views/anomaly-timeline
// Returns last 100 protocol anomalies, newest-first, with the fields needed
// to plot them on a time x deviation scatter.
router.get('/anomaly-timeline', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, anomaly_id, protocol, src_asset, dst_asset, type,
             baseline_deviation, created_at
      FROM protocol_anomalies
      ORDER BY created_at DESC NULLS LAST, id DESC
      LIMIT 100
    `);
    const rows = r.rows.map((row) => ({
      id: row.id,
      anomaly_id: row.anomaly_id,
      protocol: row.protocol,
      src_asset: row.src_asset,
      dst_asset: row.dst_asset,
      type: row.type,
      baseline_deviation: Number(row.baseline_deviation) || 0,
      created_at: row.created_at,
      ts: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
