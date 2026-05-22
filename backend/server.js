const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 3061;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3060,http://localhost:3061,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public)
app.use('/api/auth', require('./routes/auth'));

// Everything below this line requires a Bearer token.
app.use('/api', authenticateToken);

// CRUD routes — 18 OT/ICS entities (all via _crudFactory which embeds
// RBAC + bulk-import + attachments)
app.use('/api/ot-assets',           require('./routes/otAssets'));
app.use('/api/plcs',                require('./routes/plcs'));
app.use('/api/hmis',                require('./routes/hmis'));
app.use('/api/scada-servers',       require('./routes/scadaServers'));
app.use('/api/ics-alerts',          require('./routes/icsAlerts'));
app.use('/api/ics-incidents',       require('./routes/icsIncidents'));
app.use('/api/network-zones',       require('./routes/networkZones'));
app.use('/api/protocol-anomalies',  require('./routes/protocolAnomalies'));
app.use('/api/firmware-versions',   require('./routes/firmwareVersions'));
app.use('/api/vendor-patches',      require('./routes/vendorPatches'));
app.use('/api/change-windows',      require('./routes/changeWindows'));
app.use('/api/safety-systems',      require('./routes/safetySystems'));
app.use('/api/control-loops',       require('./routes/controlLoops'));
app.use('/api/operator-actions',    require('./routes/operatorActions'));
app.use('/api/ics-runbooks',        require('./routes/icsRunbooks'));
app.use('/api/network-baselines',   require('./routes/networkBaselines'));
app.use('/api/ics-iocs',            require('./routes/icsIocs'));
app.use('/api/audit-log',           require('./routes/auditLog'));

// AI routes (16 sub-endpoints + history + samples under /api/ai)
app.use('/api/ai', require('./routes/ai'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom views — visual aggregations (Purdue diagram, anomaly timeline)
app.use('/api/custom-views', require('./routes/customViews'));

// ─── Apply pass 7 (full backlog implementation) ───
// All endpoints below are ADVISORY ONLY for OT safety-critical decisions.
app.use('/api/ai-v2',                    require('./routes/aiV2'));                  // protocol-parser, asset-classifier, lateral-narrator, vuln-prioritizer
app.use('/api/network-conduits',         require('./routes/networkConduits'));       // zone editor authoring CRUD
app.use('/api/change-window-approvals',  require('./routes/changeWindowApprovals')); // approval workflow + conflicts + calendar
app.use('/api/sis-audit',                require('./routes/sisAudit'));              // SIS audit register + bypass + proof-test scheduler
app.use('/api/vendor-advisories',        require('./routes/vendorAdvisories'));      // manual ingest + ICS-CERT live 503 stub

// 404 for unmatched /api routes — mounted last on purpose.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`\nAIOTSecOpsForICS API running on http://localhost:${PORT}\n`);
});
