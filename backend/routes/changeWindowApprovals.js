// Apply pass 7 — Change-window approval workflow.
// Reasonable defaults: two-stage workflow (request → approve|reject) keyed by
// `window_id` from the existing `change_windows` table. Also exposes a
// conflict-detector and freeze-window calendar.
//
// All actions are ADVISORY — they record intent; they do not gate any
// downstream automation.

const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();

// GET /api/change-window-approvals?window_id=W-001
router.get('/', async (req, res) => {
  try {
    const wid = req.query.window_id;
    const q = wid
      ? await pool.query(
          'SELECT * FROM change_window_approvals WHERE window_id = $1 ORDER BY decided_at DESC',
          [wid]
        )
      : await pool.query(
          'SELECT * FROM change_window_approvals ORDER BY decided_at DESC LIMIT 500'
        );
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/change-window-approvals/request   { window_id, approver, reason }
router.post('/request', requireWriter, async (req, res) => {
  try {
    const { window_id, approver, reason } = req.body || {};
    if (!window_id) return res.status(400).json({ error: 'window_id is required' });
    const r = await pool.query(
      `INSERT INTO change_window_approvals (window_id, approver, decision, reason)
       VALUES ($1, $2, 'requested', $3) RETURNING *`,
      [window_id, approver || null, reason || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/change-window-approvals/:id/decide   { decision: 'approved'|'rejected'|'withdrawn', reason }
router.post('/:id/decide', requireWriter, async (req, res) => {
  try {
    const { decision, reason, approver } = req.body || {};
    const allowed = ['approved', 'rejected', 'withdrawn'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ error: `decision must be one of ${allowed.join(', ')}` });
    }
    const r = await pool.query(
      `UPDATE change_window_approvals
         SET decision = $1, reason = COALESCE($2, reason), approver = COALESCE($3, approver), decided_at = NOW()
       WHERE id = $4 RETURNING *`,
      [decision, reason || null, approver || null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/change-window-approvals/conflicts — windows whose start/end overlap.
router.get('/conflicts', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.window_id AS a_window, b.window_id AS b_window,
             a.start_at AS a_start, a.end_at AS a_end,
             b.start_at AS b_start, b.end_at AS b_end,
             a.scope AS a_scope, b.scope AS b_scope
        FROM change_windows a
        JOIN change_windows b
          ON a.id < b.id
         AND a.start_at < b.end_at
         AND b.start_at < a.end_at
       ORDER BY a.start_at DESC
       LIMIT 100`);
    res.json({ conflicts: r.rows, advisory_only: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/change-window-approvals/calendar?from=ISO&to=ISO
router.get('/calendar', async (req, res) => {
  try {
    const from = req.query.from || null;
    const to = req.query.to || null;
    const params = [];
    let where = '';
    if (from && to) { where = 'WHERE start_at >= $1 AND end_at <= $2'; params.push(from, to); }
    else if (from)  { where = 'WHERE start_at >= $1'; params.push(from); }
    else if (to)    { where = 'WHERE end_at <= $1';   params.push(to); }
    const r = await pool.query(
      `SELECT cw.*, (
         SELECT decision FROM change_window_approvals
          WHERE window_id = cw.window_id ORDER BY decided_at DESC LIMIT 1
       ) AS latest_decision
         FROM change_windows cw ${where}
        ORDER BY start_at ASC LIMIT 500`,
      params
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
