// Apply pass 7 — full backlog AI endpoints.
// All outputs are ADVISORY ONLY. OT safety-critical decisions require
// human-in-the-loop validation before any mitigation.

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai-v2] failed to record ${feature}:`, e.message);
  }
}

// Sample fills for the new AI features. Same shape contract as /api/ai/samples.
const SAMPLES = {
  'parse-protocol-payload': [
    { label: 'Modbus — function 0x10 write burst',
      values: { protocol: 'Modbus TCP', payload_text: 'TID=0001 PID=0000 LEN=000B UID=01 FC=10 ADDR=0064 QTY=0002 BC=04 DATA=00640032' } },
    { label: 'DNP3 — unsolicited response burst',
      values: { protocol: 'DNP3', payload_text: '0564 1444 01 00 02 00 C0 81 82 00 — unsolicited response, IIN 0x8200, repeated 4x baseline' } },
    { label: 'IEC-61850 GOOSE — stNum jump',
      values: { protocol: 'IEC-61850 GOOSE', payload_text: 'APPID=0x3001 stNum jumped 42 → 9821 in 12 ms; sqNum reset; allData boolean trip True' } },
    { label: 'IEC-61850 Sampled Values',
      values: { protocol: 'IEC-61850 SV', payload_text: 'svID=MUnit01 smpCnt rollover anomalous; 80 samples/cycle expected, observed 96' } },
    { label: 'EtherNet/IP — explicit messaging to PLC',
      values: { protocol: 'EtherNet/IP', payload_text: 'CIP service 0x4C (multi-service) to ControlLogix 1756 from unknown engineering host, attribute write to tag bank' } },
  ],
  'classify-asset': [
    { label: 'Siemens S7-1500 fingerprint',
      values: { fingerprint_text: 'MAC OUI 00:1B:1B (Siemens AG), open ports 102 (S7Comm), 161 (SNMP), 80 (HTTP), banner "SIMATIC S7-1500", hostname "PLC-REF-A01"' } },
    { label: 'Rockwell ControlLogix fingerprint',
      values: { fingerprint_text: 'MAC OUI 00:00:BC (Rockwell), open 44818 (EtherNet/IP), 2222 (CIP), CIP ListIdentity vendor=1 product type=14, hostname "1756-BLR-06"' } },
    { label: 'Generic Windows engineering workstation',
      values: { fingerprint_text: 'MAC OUI Dell, open 135 139 445 3389, banner "Windows 10 Pro", apps SIMATIC Manager + Studio 5000 installed, dual NICs (OT + corp)' } },
    { label: 'HIMA safety PLC fingerprint',
      values: { fingerprint_text: 'MAC OUI HIMA, open 8000/TCP (proprietary), no IT protocols, hostname "SIS-CAB1-XCPU31"' } },
    { label: 'Unknown field device',
      values: { fingerprint_text: 'MAC OUI unassigned, open 502 (Modbus), 20000 (DNP3), no banner, hostname "field-rtu-12"' } },
  ],
  'lateral-movement-narrative': [
    { label: 'Engineering WS → Refinery PLC',
      values: {
        it_iocs_text: 'Phishing email to maria.lopez; macro dropper hash a1b2c3...; C2 beacon to 185.99.x.x; lateral SMB to OTA-0005.',
        ics_iocs_text: 'Modbus function 0x10 writes from OTA-0005 → PLC-1001 at 03:14 UTC; no change window.',
        zone_crossings_text: 'Corp (ZN-6001) → OT DMZ (ZN-6002) → Engineering (ZN-6005) → Refinery Cell A (ZN-6010).',
      } },
    { label: 'Vendor remote-support hijack',
      values: {
        it_iocs_text: 'TeamViewer session from vendor IP outside usual window; credentials harvested via MFA fatigue.',
        ics_iocs_text: 'S7Comm-Plus firmware upload attempt to PLC-1006 from OTA-0015.',
        zone_crossings_text: 'Internet → DMZ jump (OTA-0015) → Boiler House (ZN-6012).',
      } },
    { label: 'Ransomware staging on DMZ',
      values: {
        it_iocs_text: 'Cobalt Strike beacon on OTA-0015; lsass dump; SMB scanning across /24.',
        ics_iocs_text: 'No PLC writes yet; Historian SCD-3003 read spikes from OTA-0015.',
        zone_crossings_text: 'DMZ (ZN-6002) → Engineering (ZN-6005); Engineering → Historian only so far.',
      } },
    { label: 'Substation reconnaissance',
      values: {
        it_iocs_text: 'No IT-side IOCs yet.',
        ics_iocs_text: 'DNP3 unsolicited bursts from PLC-1004 to SCD-3010; new master enrollment attempts.',
        zone_crossings_text: 'Substation North (ZN-6020) ↔ Control Room (ZN-6004).',
      } },
    { label: 'Supply-chain firmware backdoor',
      values: {
        it_iocs_text: 'Outbound DNS to *.no-ip.net from OT subnet.',
        ics_iocs_text: 'PLC-1011 beacons outbound post-firmware-update.',
        zone_crossings_text: 'OT L1 (ZN-6010) → OT DMZ (ZN-6002) → Internet.',
      } },
  ],
  'prioritize-vulns': [
    { label: 'Default — pending patches × full fleet', values: { focus: '' } },
    { label: 'Focus on safety systems',                values: { focus: 'Restrict prioritization to HIMA / Triconex / SIS-class assets.' } },
    { label: 'Focus on internet-adjacent assets',      values: { focus: 'Restrict prioritization to assets with internet-adjacent exposure or DMZ presence.' } },
    { label: 'Focus on refinery cells',                values: { focus: 'Restrict to refinery cell A/B PLCs and their HMIs.' } },
    { label: 'Focus on Siemens-vendor CVEs',           values: { focus: 'Restrict to Siemens (S7, WinCC) CVEs against Siemens-vendor assets.' } },
  ],
};

router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────
// 17. Per-protocol parser (LLM-based, caller-supplied payload).
// ───────────────────────────────────────────────────────────────
router.post('/parse-protocol-payload', async (req, res) => {
  try {
    const { protocol, payload, payload_text, context } = req.body || {};
    if (!protocol) return res.status(400).json({ error: 'protocol is required' });
    const pl = payload || payload_text;
    if (!pl) return res.status(400).json({ error: 'payload or payload_text is required' });
    const result = await ai.parseProtocolPayload(protocol, pl, context || {});
    await record('parse-protocol-payload', { protocol, payload_size: typeof pl === 'string' ? pl.length : null }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────
// 18. Asset auto-classifier.
// ───────────────────────────────────────────────────────────────
router.post('/classify-asset', async (req, res) => {
  try {
    const { fingerprint, fingerprint_text, context } = req.body || {};
    const fp = fingerprint || fingerprint_text;
    if (!fp) return res.status(400).json({ error: 'fingerprint or fingerprint_text is required' });
    const result = await ai.classifyAssetFromFingerprint(fp, context || {});
    await record('classify-asset', { fingerprint_size: typeof fp === 'string' ? fp.length : null }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────
// 19. IT/OT lateral-movement narrator.
// ───────────────────────────────────────────────────────────────
router.post('/lateral-movement-narrative', async (req, res) => {
  try {
    let { it_iocs, ics_iocs, zone_crossings, it_iocs_text, ics_iocs_text, zone_crossings_text, context } = req.body || {};
    if (!Array.isArray(it_iocs))   it_iocs   = it_iocs_text   ? [it_iocs_text]   : [];
    if (!Array.isArray(ics_iocs))  ics_iocs  = ics_iocs_text  ? [ics_iocs_text]  : [];
    if (!Array.isArray(zone_crossings)) zone_crossings = zone_crossings_text ? [zone_crossings_text] : [];
    if (it_iocs.length === 0 && ics_iocs.length === 0) {
      // Pull from DB as a courtesy default.
      const r = await pool.query('SELECT type,value,source FROM ics_iocs ORDER BY id DESC LIMIT 10');
      ics_iocs = r.rows;
    }
    const result = await ai.lateralMovementNarrative(it_iocs, ics_iocs, zone_crossings, context || {});
    await record('lateral-movement-narrative',
      { it_iocs_count: it_iocs.length, ics_iocs_count: ics_iocs.length, crossings_count: zone_crossings.length },
      result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────
// 20. OT-context vuln prioritizer.
// ───────────────────────────────────────────────────────────────
router.post('/prioritize-vulns', async (req, res) => {
  try {
    let { vulns, assets, focus, context } = req.body || {};
    if (!Array.isArray(vulns) || vulns.length === 0) {
      const r = await pool.query("SELECT * FROM vendor_patches WHERE status IN ('pending','staged') ORDER BY id DESC LIMIT 20");
      vulns = r.rows;
    }
    if (!Array.isArray(assets) || assets.length === 0) {
      const r = await pool.query('SELECT * FROM ot_assets ORDER BY id ASC LIMIT 40');
      assets = r.rows;
    }
    const ctx = context || (focus ? { focus } : {});
    const result = await ai.prioritizeVulnerabilities(vulns, assets, ctx);
    await record('prioritize-vulns', { vulns_count: vulns.length, assets_count: assets.length, context: ctx }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
