// Apply pass 7 — Safety-Instrumented-System (SIS) audit register.
// Reasonable defaults:
//   - entry_type ∈ {sil_verification, proof_test, bypass, override, return_to_service}
//   - bypass register surfaces all open bypasses (closed-pair logic via paired entries)
//   - proof-test scheduler returns entries with next_due_at <= now + lookahead
// All entries are ADVISORY records — they do not act on safety systems.

const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();
const ALLOWED_TYPES = ['sil_verification','proof_test','bypass','override','return_to_service'];

router.get('/', async (req, res) => {
  try {
    const { sis_id, entry_type } = req.query;
    const params = [];
    const where = [];
    if (sis_id)     { params.push(sis_id);     where.push(`sis_id = $${params.length}`); }
    if (entry_type) { params.push(entry_type); where.push(`entry_type = $${params.length}`); }
    const sql = `SELECT * FROM sis_audit_entries ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY performed_at DESC NULLS LAST, id DESC LIMIT 500`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM sis_audit_entries WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    if (b.entry_type && !ALLOWED_TYPES.includes(b.entry_type)) {
      return res.status(400).json({ error: `entry_type must be one of ${ALLOWED_TYPES.join(', ')}` });
    }
    const r = await pool.query(
      `INSERT INTO sis_audit_entries
         (entry_id, sis_id, entry_type, sil_level, performed_by, performed_at, result, next_due_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.entry_id || null, b.sis_id || null, b.entry_type || null, b.sil_level || null,
       b.performed_by || null, b.performed_at || null, b.result || null,
       b.next_due_at || null, b.notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireWriter, async (req, res) => {
  try {
    const b = req.body || {};
    if (b.entry_type && !ALLOWED_TYPES.includes(b.entry_type)) {
      return res.status(400).json({ error: `entry_type must be one of ${ALLOWED_TYPES.join(', ')}` });
    }
    const r = await pool.query(
      `UPDATE sis_audit_entries SET
         entry_id     = COALESCE($1, entry_id),
         sis_id       = COALESCE($2, sis_id),
         entry_type   = COALESCE($3, entry_type),
         sil_level    = COALESCE($4, sil_level),
         performed_by = COALESCE($5, performed_by),
         performed_at = COALESCE($6, performed_at),
         result       = COALESCE($7, result),
         next_due_at  = COALESCE($8, next_due_at),
         notes        = COALESCE($9, notes),
         updated_at   = NOW()
       WHERE id = $10 RETURNING *`,
      [b.entry_id, b.sis_id, b.entry_type, b.sil_level, b.performed_by,
       b.performed_at, b.result, b.next_due_at, b.notes, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireWriter, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM sis_audit_entries WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true, id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/sis-audit/bypass-register — open bypasses per sis_id
// "Open" = latest entry_type='bypass' that hasn't been paired with a
// later 'return_to_service' for the same sis_id.
router.get('/views/bypass-register', async (req, res) => {
  try {
    const r = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (sis_id) sis_id, entry_type, performed_by, performed_at, notes
          FROM sis_audit_entries
         WHERE entry_type IN ('bypass','return_to_service')
         ORDER BY sis_id, performed_at DESC NULLS LAST, id DESC
      )
      SELECT * FROM latest WHERE entry_type = 'bypass' ORDER BY performed_at DESC NULLS LAST`);
    res.json({ open_bypasses: r.rows, advisory_only: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/sis-audit/views/proof-test-schedule?days=90
router.get('/views/proof-test-schedule', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 90, 730);
    const r = await pool.query(
      `SELECT sis_id, sil_level, performed_at, next_due_at, result, notes
         FROM sis_audit_entries
        WHERE entry_type = 'proof_test'
          AND next_due_at IS NOT NULL
          AND next_due_at <= NOW() + ($1 || ' days')::interval
        ORDER BY next_due_at ASC LIMIT 500`,
      [String(days)]
    );
    res.json({ window_days: days, due: r.rows, advisory_only: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
