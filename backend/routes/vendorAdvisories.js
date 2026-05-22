// Apply pass 7 — Vendor advisory ingest.
// Reasonable defaults:
//   - Manual ingest is a writeable surface (POST /).
//   - Live ICS-CERT / Siemens ProductCERT / Schneider / Rockwell feed pull is
//     gated behind a credential / data-share agreement we do not have wired,
//     so /pull-live returns 503 with a structured stub payload.
//   - "Promote" moves a reviewed advisory into vendor_patches (best-effort join
//     by vendor+affected). The original advisory row records promoted_patch_id.
// ADVISORY ONLY — promotion does not auto-schedule patching.

const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();
const ALLOWED_SOURCES = ['ICS-CERT','Siemens','Schneider','Rockwell','HIMA','ABB','manual','other'];
const ALLOWED_STATUS  = ['new','reviewed','promoted','dismissed'];

router.get('/', async (req, res) => {
  try {
    const { source, status, vendor } = req.query;
    const params = [];
    const where = [];
    if (source) { params.push(source); where.push(`source = $${params.length}`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (vendor) { params.push(vendor); where.push(`vendor = $${params.length}`); }
    const sql = `SELECT * FROM vendor_advisories ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY published_at DESC NULLS LAST, id DESC LIMIT 500`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM vendor_advisories WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    if (b.source && !ALLOWED_SOURCES.includes(b.source)) {
      return res.status(400).json({ error: `source must be one of ${ALLOWED_SOURCES.join(', ')}` });
    }
    if (b.status && !ALLOWED_STATUS.includes(b.status)) {
      return res.status(400).json({ error: `status must be one of ${ALLOWED_STATUS.join(', ')}` });
    }
    const r = await pool.query(
      `INSERT INTO vendor_advisories
         (advisory_id, source, vendor, title, severity, cve_ids, affected, url, published_at, status, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [b.advisory_id || null, b.source || 'manual', b.vendor || null,
       b.title || null, b.severity || 'medium', b.cve_ids || null,
       b.affected || null, b.url || null, b.published_at || null,
       b.status || 'new', b.raw || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    if (b.source && !ALLOWED_SOURCES.includes(b.source)) {
      return res.status(400).json({ error: `source must be one of ${ALLOWED_SOURCES.join(', ')}` });
    }
    if (b.status && !ALLOWED_STATUS.includes(b.status)) {
      return res.status(400).json({ error: `status must be one of ${ALLOWED_STATUS.join(', ')}` });
    }
    const r = await pool.query(
      `UPDATE vendor_advisories SET
         advisory_id  = COALESCE($1,advisory_id),
         source       = COALESCE($2,source),
         vendor       = COALESCE($3,vendor),
         title        = COALESCE($4,title),
         severity     = COALESCE($5,severity),
         cve_ids      = COALESCE($6,cve_ids),
         affected     = COALESCE($7,affected),
         url          = COALESCE($8,url),
         published_at = COALESCE($9,published_at),
         status       = COALESCE($10,status),
         updated_at   = NOW()
       WHERE id = $11 RETURNING *`,
      [b.advisory_id, b.source, b.vendor, b.title, b.severity,
       b.cve_ids, b.affected, b.url, b.published_at, b.status, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWriter, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM vendor_advisories WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true, id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor-advisories/:id/promote — write into vendor_patches
router.post('/:id/promote', requireWriter, async (req, res) => {
  try {
    const adv = await pool.query('SELECT * FROM vendor_advisories WHERE id = $1', [req.params.id]);
    if (!adv.rows.length) return res.status(404).json({ error: 'not found' });
    const a = adv.rows[0];
    const patchId = a.advisory_id || `ADV-${a.id}`;
    // vendor_patches schema columns are not guaranteed beyond a few defaults;
    // insert the well-known subset that exists across the seed.
    const pre = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='vendor_patches'"
    );
    const cols = new Set(pre.rows.map((r) => r.column_name));
    const payload = {};
    if (cols.has('patch_id'))     payload.patch_id     = patchId;
    if (cols.has('advisory'))     payload.advisory     = a.title;
    if (cols.has('vendor'))       payload.vendor       = a.vendor;
    if (cols.has('severity'))     payload.severity     = a.severity;
    if (cols.has('status'))       payload.status       = 'pending';
    if (cols.has('cve'))          payload.cve          = (a.cve_ids || '').split(',')[0] || null;
    if (cols.has('affected'))     payload.affected     = a.affected;
    if (cols.has('url'))          payload.url          = a.url;
    const keys = Object.keys(payload);
    let promoted = null;
    if (keys.length) {
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const sql = `INSERT INTO vendor_patches (${keys.join(',')}) VALUES (${placeholders})
                   ON CONFLICT DO NOTHING RETURNING *`;
      const ins = await pool.query(sql, keys.map((k) => payload[k]));
      promoted = ins.rows[0] || null;
    }
    await pool.query(
      `UPDATE vendor_advisories SET status='promoted', promoted_patch_id=$1, updated_at=NOW() WHERE id=$2`,
      [patchId, a.id]
    );
    res.json({ advisory_id: a.advisory_id, promoted_patch_id: patchId, patch_row: promoted, advisory_only: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor-advisories/pull-live  — NEEDS-CREDS, returns 503 stub.
router.post('/pull-live', (req, res) => {
  res.status(503).json({
    error: 'live_feed_unavailable',
    detail: 'Live ICS-CERT / Siemens ProductCERT / Schneider / Rockwell advisory ingest requires credentials and a data-share agreement that is not wired in this environment. Use POST /api/vendor-advisories to ingest manually.',
    expected_sources: ['ICS-CERT','Siemens','Schneider','Rockwell','HIMA','ABB'],
    advisory_only: true,
    next_steps: [
      'Provision OAuth / API key per vendor portal.',
      'Set VENDOR_ADVISORY_FEED_* env vars (per source).',
      'Re-attempt /pull-live; payloads land in vendor_advisories with status="new".',
    ],
  });
});

module.exports = router;
