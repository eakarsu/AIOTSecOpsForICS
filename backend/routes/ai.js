const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

// Persist every AI result so the frontend history viewer can show it later.
async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai] failed to record ${feature}:`, e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// Sample fills — realistic OT/ICS scenarios per AI feature.
// Returned values map 1:1 to field `key`s used by the frontend AI page.
// ──────────────────────────────────────────────────────────────
const SAMPLES = {
  'triage-ics-alert': [
    { label: 'Suspicious Modbus write to PLC during off-hours',
      values: { alert_text: 'Modbus function code 0x10 (multi-register write) to PLC-1001 at 03:14 UTC from engineering WS OTA-0005; no change window open.' } },
    { label: 'DNP3 unsolicited response burst from substation',
      values: { alert_text: 'DNP3 unsolicited response storm from PLC-1004 (Generator Hall) to SCD-3010; 4x baseline rate; deviation 180%.' } },
    { label: 'Unauthorized firmware update attempt detected',
      values: { alert_text: 'Firmware upload attempt to PLC-1006 (Boiler House) via S7Comm-Plus from unknown host 10.10.35.42; vendor signature missing.' } },
    { label: 'Operator override outside change window',
      values: { alert_text: 'Operator maria.lopez issued LI-2010 alarm bypass on PLC-1002 at 22:00 UTC; no MoC ticket; no change window scheduled.' } },
    { label: 'Protocol anomaly cluster on Purdue level 2',
      values: { alert_text: 'Cluster of OPC UA and Profinet anomalies on Purdue L2 between SCD-3001 and HMI-2001 over 12 minutes; 6 distinct signatures.' } },
  ],

  'baseline-protocol': [
    { label: 'Modbus TCP — Refinery Cell A',     values: { zone: 'Refinery Cell A',  protocol: 'Modbus TCP' } },
    { label: 'DNP3 — Substation North',          values: { zone: 'Substation North', protocol: 'DNP3' } },
    { label: 'EtherNet/IP — Boiler House',       values: { zone: 'Boiler House',     protocol: 'EtherNet/IP' } },
    { label: 'OPC UA — Polymer Reactor',         values: { zone: 'Polymer Reactor',  protocol: 'OPC UA' } },
    { label: 'IEC-61850 — Generator Hall',       values: { zone: 'Generator Hall',   protocol: 'IEC-61850' } },
  ],

  'classify-incident': [
    { label: 'Suspicious Modbus write to PLC during off-hours',
      values: { incident_text: 'Off-hours Modbus write to refinery PLC-1001 from engineering WS; no change window. Suspected lateral movement from compromised engineering account.' } },
    { label: 'DNP3 unsolicited response burst',
      values: { incident_text: 'DNP3 unsolicited response burst from substation PLC-1004; suggests reconnaissance or misconfigured outstation.' } },
    { label: 'Unauthorized firmware update detected',
      values: { incident_text: 'Firmware tampering attempt on boiler PLC-1006; unauthenticated upload from rogue host in OT DMZ.' } },
    { label: 'Operator override outside change window',
      values: { incident_text: 'Operator bypassed LI-2010 alarm on PLC-1002 outside change window; possible policy violation, no malicious indicators.' } },
    { label: 'Protocol anomaly cluster on Purdue level 2',
      values: { incident_text: 'OPC UA / Profinet anomaly cluster on Purdue L2; multiple protocols deviating simultaneously; suspected exploitation campaign.' } },
  ],

  'suggest-isolation': [
    { label: 'Isolate compromised engineering WS (OTA-0005)',
      values: { target: 'OTA-0005 — Engineering Workstation', notes: 'Suspected to be source of unauthorized Modbus writes; needs containment without losing forensic state.' } },
    { label: 'Isolate substation PLC-1004 (Generator Hall)',
      values: { target: 'PLC-1004 — AC 800M PM866 in Generator Hall', notes: 'DNP3 unsolicited response burst; active grid frequency support; cannot trip generator.' } },
    { label: 'Isolate Boiler House zone',
      values: { target: 'Zone ZN-6012 — Boiler House', notes: 'Unauthorized firmware push attempted on PLC-1006; want to quarantine zone but keep boiler running.' } },
    { label: 'Isolate jump host OTA-0015',
      values: { target: 'OTA-0015 — DMZ Jump Server (Windows Server 2019)', notes: 'Suspected ransomware staging; used for vendor remote support.' } },
    { label: 'Isolate Tank Farm East PLC-1012',
      values: { target: 'PLC-1012 — Phoenix Contact AXC F 2152 in Tank Farm East', notes: 'Network baseline breach detected; tank levels still need to be monitored.' } },
  ],

  'draft-change-procedure': [
    { label: 'Patch Siemens S7-1500 in refinery',
      values: { scope: 'Patch Siemens S7-1500 PLC-1001 (Refinery Zone A) firmware from V2.8.1 → V2.9.2.', constraints: 'Must be completed in 4hr window; refinery cannot trip; redundant path through PLC-1015 available.' } },
    { label: 'Failover Substation North to standby',
      values: { scope: 'Failover SCADA primary SCD-3010 → standby SCD-3011 at Substation North.', constraints: 'Zero load loss; coordinate with grid operator; tested rollback path required.' } },
    { label: 'Push DMZ firewall rules',
      values: { scope: 'Tighten outbound HTTPS egress rules at OT DMZ firewall.', constraints: '15 min window only; must not break vendor remote support; full rollback in 5 min if HMI loses cloud reporting.' } },
    { label: 'Replace Tank Farm PLC-1012',
      values: { scope: 'Physical replacement of PLC-1012 (Phoenix Contact AXC F 2152) at Tank Farm East.', constraints: 'Tank levels must be monitored throughout; lockout/tagout per OSHA; 4hr planned outage.' } },
    { label: 'Apply DeltaV controller hardening',
      values: { scope: 'Apply Emerson DeltaV controller v14 hardening profile across DCS Module 4.', constraints: 'Cannot exceed 30 min combined controller maintenance window; production rate must hold.' } },
  ],

  'vendor-patch-impact': [
    { label: 'SSA-714771 — Siemens S7-1500 auth bypass',
      values: { advisory: 'SSA-714771 — S7-1500 auth bypass (critical). Affected: S7-1500 V2.8.x. Patched in V2.9.2.' } },
    { label: 'CVE-2026-1102 — Rockwell Logix logic injection',
      values: { advisory: 'CVE-2026-1102 — Rockwell ControlLogix 1756 logic injection (high). Affected: v32.x. Patched in v33.012.' } },
    { label: 'ABBVU-PSGS-1A45 — AC 800M memory overflow',
      values: { advisory: 'ABBVU-PSGS-1A45 — AC 800M PM866 memory overflow (high). Affected: 6.0.1. Patched in 6.0.3.' } },
    { label: 'HIMA-A-2026-002 — config write w/o auth',
      values: { advisory: 'HIMA-A-2026-002 — HIMax X-CPU-31 unauthenticated config write (critical). Patched in HCFW6.30.' } },
    { label: 'MA-2026-007 — Mitsubishi FX5U remote code',
      values: { advisory: 'MA-2026-007 — Mitsubishi FX5U-R32 remote code execution (critical). Affected versions <1.260.' } },
  ],

  'control-loop-anomaly': [
    { label: 'Generator Speed (LP-3304) oscillating',
      values: { loop_id: 'LP-3304', telemetry_notes: 'SI-4100.PV oscillating ±4% around SP for 15 minutes; integral wind-up suspected; rotor not at hard limit.' } },
    { label: 'Tank Farm Level (LP-3311) frozen',
      values: { loop_id: 'LP-3311', telemetry_notes: 'LI-1330.PV has been flat-line 47.2% for 90 minutes; physical level changed per manual gauging.' } },
    { label: 'Mixing Unit Ratio (LP-3315) oscillating',
      values: { loop_id: 'LP-3315', telemetry_notes: 'FI-1770.PV oscillating ±8% around new SP after grade transition.' } },
    { label: 'Crude Inlet Temp (LP-3301) suspicious',
      values: { loop_id: 'LP-3301', telemetry_notes: 'TI-1001.PV rapid step changes coincident with off-hours Modbus writes; not consistent with feed.' } },
    { label: 'Boiler Drum Level (LP-3302) saturated',
      values: { loop_id: 'LP-3302', telemetry_notes: 'LI-2010.CV pegged at 100% for 8 minutes; PV climbing; safety system not yet tripped.' } },
  ],

  'safety-impact': [
    { label: 'SIS forced into bypass during cyber event',
      values: { event: 'Safety system SIS-2204 (Generator Hall Trip) forced into bypass mode for 4 minutes coincident with unauthorized Modbus writes to PLC-1004.' } },
    { label: 'Unauthorized firmware push on boiler',
      values: { event: 'Firmware tampering attempt on PLC-1006 (Boiler House) — controller behavior since reload is anomalous; burner management interactions observed.' } },
    { label: 'Alarm flood suppressing safety-relevant alarms',
      values: { event: 'Alarm flood from Historian disk fill suppressed visibility on safety-related alarms for 38 minutes across Refinery Cell A.' } },
    { label: 'PLC stop command issued from rogue node',
      values: { event: 'PLC STOP command issued to PLC-1010 (Conveyor Cell 3) from unknown source; downstream packaging line tripped.' } },
    { label: 'GPS time spoofing affecting station',
      values: { event: 'Station time skewed by GPS spoofing; SIS-2208 (Substation Trip) lost time-stamp coherence for 11 minutes.' } },
  ],

  'executive-brief': [
    { label: 'Default snapshot — no bias',
      values: { notes: '' } },
    { label: 'Bias toward refinery safety risk',
      values: { notes: 'Bias the brief toward refinery and process safety risk this week.' } },
    { label: 'Bias toward vendor patch backlog',
      values: { notes: 'Focus on vendor patch backlog, especially Siemens / Rockwell / HIMA critical advisories.' } },
    { label: 'Bias toward insider / operator behavior',
      values: { notes: 'Focus on operator overrides and out-of-window actions; raise insider risk profile.' } },
    { label: 'Bias toward supply-chain firmware',
      values: { notes: 'Focus on vendor supply-chain firmware risk and unverified firmware uploads.' } },
  ],

  'hunt-attack-path': [
    { label: 'Hypothesis — engineering WS → PLC',
      values: { hypothesis: 'Compromised engineering workstation OTA-0005 is being used to stage unauthorized PLC firmware uploads across Purdue L2.' } },
    { label: 'Hypothesis — vendor remote support abuse',
      values: { hypothesis: 'Vendor remote-support session was hijacked and is being used to pivot from the DMZ jump server into the OT historian.' } },
    { label: 'Hypothesis — ransomware staging in DMZ',
      values: { hypothesis: 'Ransomware actor is staging on the OT DMZ jump host OTA-0015 and preparing to encrypt engineering shares.' } },
    { label: 'Hypothesis — protocol-level attack on substation',
      values: { hypothesis: 'Adversary is using DNP3 unsolicited responses to probe substation outstations from a foothold in the operations zone.' } },
    { label: 'Hypothesis — supply-chain firmware backdoor',
      values: { hypothesis: 'A recent firmware update contains a vendor supply-chain backdoor and is calling out from PLC-1011 to an external IOC.' } },
  ],

  'asset-criticality': [
    { label: 'Refinery PLC-1001',                values: { asset_text: 'PLC-1001 — Siemens S7-1500, Refinery Zone A, Purdue L1, controls feed valves to crude column.' } },
    { label: 'Generator Hall PLC-1004',           values: { asset_text: 'PLC-1004 — ABB AC 800M PM866, Generator Hall, Purdue L1, controls turbine governor.' } },
    { label: 'Safety Cabinet HIMA PLC-1007',      values: { asset_text: 'PLC-1007 — HIMA HIMax X-CPU-31 in Safety Cabinet 1, SIL3, ESD logic solver for refinery.' } },
    { label: 'Historian SCD-3003',                values: { asset_text: 'SCD-3003 — OSIsoft PI Historian 2018 SP3, Data Center, cluster, feeds compliance reporting.' } },
    { label: 'DMZ Jump Server OTA-0015',          values: { asset_text: 'OTA-0015 — Windows Server 2019 DMZ jump host used for vendor remote support; lives in Purdue L3.5.' } },
  ],

  'network-segmentation': [
    { label: 'Default — all zones',          values: { focus: '' } },
    { label: 'Refinery cells only',          values: { focus: 'Restrict focus to refinery cells A and B and their supervisory zones.' } },
    { label: 'OT DMZ posture review',        values: { focus: 'Focus on OT DMZ posture and outbound traffic from L3 to enterprise / internet.' } },
    { label: 'Safety system segmentation',   values: { focus: 'Focus on the Safety System network zone (ZN-6007) and how it connects to control zones.' } },
    { label: 'Vendor remote-support paths',  values: { focus: 'Focus on vendor remote-support zone (ZN-6014) and how it reaches Purdue L1/L2 devices.' } },
  ],

  'malicious-firmware-detect': [
    { label: 'Suspicious Siemens S7-1500 image',
      values: { sample_text: 'Firmware image labelled "S7-1500 V2.9.2 hotfix", 8.2 MB, signature missing, uploaded by host 10.10.35.42, hash 5e88...d2d8.' } },
    { label: 'Rockwell ControlLogix candidate',
      values: { sample_text: 'ControlLogix 1756 image v33.012, signed by Rockwell, but hash differs from vendor advisory by 4 bytes near the bootloader.' } },
    { label: 'Schneider Modicon image — unknown',
      values: { sample_text: 'Modicon M580 SV4.20 image with extra config block of 12 KB not present in vendor reference image.' } },
    { label: 'HIMA SIS firmware',
      values: { sample_text: 'HIMax X-CPU-31 HCFW6.30 image, signed, vendor authenticity verified, no anomalies in entropy or layout.' } },
    { label: 'Generic embedded image (no metadata)',
      values: { sample_text: 'Unknown ELF binary 1.7 MB, found on engineering WS OTA-0005, references PLC-style tags and OPC UA strings.' } },
  ],

  'operator-action-review': [
    { label: 'Default — last 15 actions', values: {} },
    { label: 'Default — last 15 actions', values: {} },
    { label: 'Default — last 15 actions', values: {} },
    { label: 'Default — last 15 actions', values: {} },
    { label: 'Default — last 15 actions', values: {} },
  ],

  'mitre-ics-mapper': [
    { label: 'Suspicious Modbus write to PLC during off-hours',
      values: { observations_text: 'Off-hours Modbus function 0x10 writes from engineering WS to refinery PLC; bypassed change-window controls.' } },
    { label: 'DNP3 unsolicited response burst',
      values: { observations_text: 'Substation outstation issuing DNP3 unsolicited responses 4x baseline; coincides with new master enrollment attempts.' } },
    { label: 'Unauthorized firmware update detected',
      values: { observations_text: 'Unauthenticated firmware upload to PLC; engineering software in use; vendor signature absent.' } },
    { label: 'Operator override outside change window',
      values: { observations_text: 'Operator override of analog alarm outside approved change window; alarm shelving without MoC.' } },
    { label: 'Protocol anomaly cluster on Purdue level 2',
      values: { observations_text: 'OPC UA and Profinet anomaly cluster on Purdue L2 — enumeration, malformed packets, new sessions.' } },
  ],

  'supply-chain-firmware': [
    { label: 'Full vendor portfolio review',
      values: { focus: '' } },
    { label: 'Siemens-specific deep dive',
      values: { focus: 'Focus on Siemens (S7-1500, WinCC, SIMATIC Manager) supply-chain risk and recent advisories.' } },
    { label: 'Rockwell-specific deep dive',
      values: { focus: 'Focus on Rockwell (ControlLogix, FactoryTalk) supply-chain risk and recent advisories.' } },
    { label: 'Safety-system suppliers',
      values: { focus: 'Focus on safety-system suppliers (HIMA, Triconex equivalents) and SIS firmware integrity.' } },
    { label: 'Recently-onboarded vendors only',
      values: { focus: 'Focus on vendors onboarded in the past 12 months and their firmware signing posture.' } },
  ],
};

// GET /api/ai/samples?feature=<verb>
router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/history?feature=<name>&limit=<n>
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    let r;
    if (feature) {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ──────────────────────────────────────────────────────────────
// 1. Triage ICS Alert
// ──────────────────────────────────────────────────────────────
router.post('/triage-ics-alert', async (req, res) => {
  try {
    let { alert, alert_text, context } = req.body || {};
    if (!alert && alert_text) alert = { text: alert_text };
    if (!alert) {
      const r = await pool.query("SELECT * FROM ics_alerts WHERE status IN ('open','triaging') ORDER BY id DESC LIMIT 1");
      alert = r.rows[0] || { text: 'No open alerts in queue.' };
    }
    const result = await ai.triageIcsAlert(alert, context || {});
    await record('triage-ics-alert', { alert }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Baseline Protocol
router.post('/baseline-protocol', async (req, res) => {
  try {
    const { zone, protocol, observation } = req.body || {};
    if (!zone || !protocol) return res.status(400).json({ error: 'zone and protocol are required' });
    const result = await ai.baselineProtocol(zone, protocol, observation || {});
    await record('baseline-protocol', { zone, protocol, observation }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Classify Incident
router.post('/classify-incident', async (req, res) => {
  try {
    let { incident, incident_text, context } = req.body || {};
    if (!incident && incident_text) incident = { text: incident_text };
    if (!incident) {
      const r = await pool.query("SELECT * FROM ics_incidents WHERE status IN ('open','investigating') ORDER BY id DESC LIMIT 1");
      incident = r.rows[0] || { text: 'No open incidents.' };
    }
    const result = await ai.classifyIncident(incident, context || {});
    await record('classify-incident', { incident }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Suggest Isolation
router.post('/suggest-isolation', async (req, res) => {
  try {
    const { target, notes, context } = req.body || {};
    if (!target) return res.status(400).json({ error: 'target is required' });
    const ctx = context || (notes ? { notes } : {});
    const result = await ai.suggestIsolation(target, ctx);
    await record('suggest-isolation', { target, context: ctx }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Draft Change Procedure
router.post('/draft-change-procedure', async (req, res) => {
  try {
    const { scope, constraints } = req.body || {};
    if (!scope) return res.status(400).json({ error: 'scope is required' });
    const cons = typeof constraints === 'string' ? { notes: constraints } : (constraints || {});
    const result = await ai.draftChangeProcedure(scope, cons);
    await record('draft-change-procedure', { scope, constraints: cons }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Vendor Patch Impact
router.post('/vendor-patch-impact', async (req, res) => {
  try {
    let { patch, advisory } = req.body || {};
    if (!patch && advisory) patch = { advisory };
    if (!patch) {
      const r = await pool.query("SELECT * FROM vendor_patches WHERE status IN ('pending','staged') ORDER BY id DESC LIMIT 1");
      patch = r.rows[0] || { advisory: 'No pending patches.' };
    }
    const fleet = await pool.query('SELECT * FROM ot_assets ORDER BY id ASC LIMIT 30');
    const result = await ai.vendorPatchImpact(patch, fleet.rows);
    await record('vendor-patch-impact', { patch, fleet_size: fleet.rows.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. Control Loop Anomaly
router.post('/control-loop-anomaly', async (req, res) => {
  try {
    const { loop_id, telemetry_notes, telemetry } = req.body || {};
    let loop = null;
    if (loop_id) {
      const r = await pool.query('SELECT * FROM control_loops WHERE loop_id = $1', [loop_id]);
      loop = r.rows[0] || { loop_id };
    } else {
      const r = await pool.query("SELECT * FROM control_loops WHERE status IN ('oscillating','frozen','suspicious') ORDER BY id DESC LIMIT 1");
      loop = r.rows[0] || { loop_id: 'unknown' };
    }
    const tel = telemetry || (telemetry_notes ? { notes: telemetry_notes } : {});
    const result = await ai.controlLoopAnomaly(loop, tel);
    await record('control-loop-anomaly', { loop, telemetry: tel }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. Safety Impact
router.post('/safety-impact', async (req, res) => {
  try {
    const { event, context } = req.body || {};
    if (!event) return res.status(400).json({ error: 'event is required' });
    const result = await ai.safetyImpact(event, context || {});
    await record('safety-impact', { event, context }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9. Executive Brief
router.post('/executive-brief', async (req, res) => {
  try {
    const [alerts, incidents, patches, assets, sis] = await Promise.all([
      pool.query("SELECT COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) AS total FROM ics_alerts"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status IN ('open','investigating')) AS active, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) AS total FROM ics_incidents"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='pending') AS pending, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) AS total FROM vendor_patches"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE criticality='critical') AS critical FROM ot_assets"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='degraded') AS degraded, COUNT(*) FILTER (WHERE status='bypassed') AS bypassed, COUNT(*) AS total FROM safety_systems"),
    ]);
    const snapshot = {
      alerts: alerts.rows[0],
      incidents: incidents.rows[0],
      vendor_patches: patches.rows[0],
      ot_assets: assets.rows[0],
      safety_systems: sis.rows[0],
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    };
    const result = await ai.executiveBrief(snapshot);
    const out = { snapshot, brief: result };
    await record('executive-brief', { notes: req.body?.notes || null }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 10. Hunt Attack Path
router.post('/hunt-attack-path', async (req, res) => {
  try {
    const { hypothesis, context } = req.body || {};
    if (!hypothesis) return res.status(400).json({ error: 'hypothesis is required' });
    const result = await ai.huntAttackPath(hypothesis, context || {});
    await record('hunt-attack-path', { hypothesis, context }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 11. Asset Criticality
router.post('/asset-criticality', async (req, res) => {
  try {
    let { asset, asset_text, asset_id, context } = req.body || {};
    if (!asset && asset_text) asset = { text: asset_text };
    if (!asset && asset_id) {
      const r = await pool.query('SELECT * FROM ot_assets WHERE asset_id = $1', [asset_id]);
      asset = r.rows[0] || { asset_id };
    }
    if (!asset) {
      const r = await pool.query("SELECT * FROM ot_assets WHERE criticality = 'critical' ORDER BY id DESC LIMIT 1");
      asset = r.rows[0] || { text: 'No critical asset selected.' };
    }
    const result = await ai.assetCriticality(asset, context || {});
    await record('asset-criticality', { asset }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 12. Network Segmentation
router.post('/network-segmentation', async (req, res) => {
  try {
    const { focus, constraints } = req.body || {};
    const zonesRow = await pool.query('SELECT * FROM network_zones ORDER BY id ASC');
    const cons = constraints || (focus ? { focus } : {});
    const result = await ai.networkSegmentation(zonesRow.rows, cons);
    await record('network-segmentation', { zones_count: zonesRow.rows.length, constraints: cons }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 13. Malicious Firmware Detect
router.post('/malicious-firmware-detect', async (req, res) => {
  try {
    let { sample, sample_text, context } = req.body || {};
    if (!sample && sample_text) sample = { text: sample_text };
    if (!sample) return res.status(400).json({ error: 'sample is required' });
    const result = await ai.maliciousFirmwareDetect(sample, context || {});
    await record('malicious-firmware-detect', { sample }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 14. Operator Action Review
router.post('/operator-action-review', async (req, res) => {
  try {
    let { actions, context } = req.body || {};
    if (!Array.isArray(actions) || actions.length === 0) {
      const r = await pool.query('SELECT * FROM operator_actions ORDER BY id DESC LIMIT 15');
      actions = r.rows;
    }
    const result = await ai.operatorActionReview(actions, context || {});
    await record('operator-action-review', { count: actions.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 15. MITRE ATT&CK for ICS Mapper
router.post('/mitre-ics-mapper', async (req, res) => {
  try {
    let { observations, observations_text, context } = req.body || {};
    if (!Array.isArray(observations)) {
      observations = observations_text ? [observations_text] : [];
    }
    if (observations.length === 0) {
      return res.status(400).json({ error: 'observations array or observations_text is required' });
    }
    const result = await ai.mitreIcsMapper(observations, context || {});
    await record('mitre-ics-mapper', { count: observations.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 16. Supply-Chain Firmware Risk
router.post('/supply-chain-firmware', async (req, res) => {
  try {
    const { focus, context } = req.body || {};
    const vRow = await pool.query('SELECT DISTINCT vendor FROM ot_assets ORDER BY vendor');
    const vendors = vRow.rows.map((r) => r.vendor).filter(Boolean);
    const ctx = context || (focus ? { focus } : {});
    const result = await ai.supplyChainFirmware(vendors, ctx);
    await record('supply-chain-firmware', { vendors_count: vendors.length, context: ctx }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
