const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

function verifyScryptPassword(password, encoded){
  return new Promise((resolve)=>{
    const [scheme,saltHex,digestHex]=String(encoded||'').split('$');
    if(scheme!=='scrypt'||!/^[a-f0-9]{32,}$/.test(saltHex||'')||!/^[a-f0-9]{128}$/.test(digestHex||''))return resolve(false);
    crypto.scrypt(password,Buffer.from(saltHex,'hex'),64,(error,derived)=>{
      if(error)return resolve(false);
      const expected=Buffer.from(digestHex,'hex');
      resolve(expected.length===derived.length&&crypto.timingSafeEqual(expected,derived));
    });
  });
}

async function findDbUser(email, password) {
  try {
    const r = await pool.query(
      'SELECT id, email, password, name, role FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (!r.rows.length) return null;
    const u = r.rows[0];
    if (!(await verifyScryptPassword(password,u.password))) return null;
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  } catch (e) {
    return null;
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await findDbUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Session user no longer exists' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Unable to verify persisted session' });
  }
});

// GET /api/auth/users  (commander only)
const { requireCommander } = require('../middleware/auth');
router.get('/users', authenticateToken, requireCommander, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
