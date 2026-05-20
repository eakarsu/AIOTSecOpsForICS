const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [
      otAssets, plcs, hmis, scada, alerts, incidents, zones, anomalies,
      firmwares, patches, windows, sis, loops, ops, runbooks, baselines, iocs, audit,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE criticality='critical') AS critical FROM ot_assets"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='online') AS online, COUNT(*) FILTER (WHERE status='degraded') AS degraded FROM plcs"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='online') AS online, COUNT(*) FILTER (WHERE status='eol') AS eol FROM hmis"),
      pool.query("SELECT COUNT(*) AS total FROM scada_servers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE severity='critical') AS critical FROM ics_alerts"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status IN ('open','investigating')) AS active, COUNT(*) FILTER (WHERE severity='critical') AS critical FROM ics_incidents"),
      pool.query("SELECT COUNT(*) AS total FROM network_zones"),
      pool.query("SELECT COUNT(*) AS total FROM protocol_anomalies"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE latest = TRUE) AS latest FROM firmware_versions"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='pending') AS pending, COUNT(*) FILTER (WHERE severity='critical') AS critical FROM vendor_patches"),
      pool.query("SELECT COUNT(*) AS total FROM change_windows"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='healthy') AS healthy, COUNT(*) FILTER (WHERE status='degraded') AS degraded, COUNT(*) FILTER (WHERE status='bypassed') AS bypassed FROM safety_systems"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='oscillating') AS oscillating FROM control_loops"),
      pool.query("SELECT COUNT(*) AS total FROM operator_actions"),
      pool.query("SELECT COUNT(*) AS total FROM ics_runbooks"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='breach') AS breach FROM network_baselines"),
      pool.query("SELECT COUNT(*) AS total FROM ics_iocs"),
      pool.query("SELECT COUNT(*) AS total FROM audit_log"),
    ]);

    res.json({
      ot_assets: otAssets.rows[0],
      plcs: plcs.rows[0],
      hmis: hmis.rows[0],
      scada_servers: scada.rows[0],
      ics_alerts: alerts.rows[0],
      ics_incidents: incidents.rows[0],
      network_zones: zones.rows[0],
      protocol_anomalies: anomalies.rows[0],
      firmware_versions: firmwares.rows[0],
      vendor_patches: patches.rows[0],
      change_windows: windows.rows[0],
      safety_systems: sis.rows[0],
      control_loops: loops.rows[0],
      operator_actions: ops.rows[0],
      ics_runbooks: runbooks.rows[0],
      network_baselines: baselines.rows[0],
      ics_iocs: iocs.rows[0],
      audit_log: audit.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
