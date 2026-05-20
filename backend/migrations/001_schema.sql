-- AIOTSecOpsForICS schema (18 OT/ICS domain entities + cross-cutting tables)

-- ─────────────────────────────────────────────
-- 18 OT/ICS domain entities
-- Each: id (PK) + 6 domain fields + created_at/updated_at
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ot_assets (
  id              SERIAL PRIMARY KEY,
  asset_id        VARCHAR(50) UNIQUE,
  type            VARCHAR(60),
  vendor          VARCHAR(120),
  model           VARCHAR(120),
  criticality     VARCHAR(20) DEFAULT 'medium',
  zone            VARCHAR(80),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plcs (
  id              SERIAL PRIMARY KEY,
  plc_id          VARCHAR(50) UNIQUE,
  vendor          VARCHAR(120),
  firmware        VARCHAR(80),
  location        VARCHAR(150),
  status          VARCHAR(30) DEFAULT 'online',
  last_patch      DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hmis (
  id                 SERIAL PRIMARY KEY,
  hmi_id             VARCHAR(50) UNIQUE,
  plant              VARCHAR(150),
  operating_system   VARCHAR(80),
  version            VARCHAR(50),
  status             VARCHAR(30) DEFAULT 'online',
  owner              VARCHAR(120),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scada_servers (
  id              SERIAL PRIMARY KEY,
  server_id       VARCHAR(50) UNIQUE,
  role            VARCHAR(60),
  version         VARCHAR(50),
  location        VARCHAR(150),
  redundancy      VARCHAR(40),
  last_backup     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ics_alerts (
  id              SERIAL PRIMARY KEY,
  alert_id        VARCHAR(50) UNIQUE,
  source          VARCHAR(120),
  severity        VARCHAR(20) DEFAULT 'medium',
  asset_id        VARCHAR(50),
  signature       VARCHAR(200),
  status          VARCHAR(30) DEFAULT 'open',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ics_incidents (
  id              SERIAL PRIMARY KEY,
  incident_id     VARCHAR(50) UNIQUE,
  title           VARCHAR(200),
  status          VARCHAR(30) DEFAULT 'open',
  severity        VARCHAR(20) DEFAULT 'medium',
  opened_at       TIMESTAMPTZ,
  owner           VARCHAR(120),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_zones (
  id              SERIAL PRIMARY KEY,
  zone_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(120),
  purdue_level    VARCHAR(20),
  criticality     VARCHAR(20) DEFAULT 'medium',
  gateway         VARCHAR(80),
  asset_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_anomalies (
  id                  SERIAL PRIMARY KEY,
  anomaly_id          VARCHAR(50) UNIQUE,
  protocol            VARCHAR(40),
  src_asset           VARCHAR(80),
  dst_asset           VARCHAR(80),
  type                VARCHAR(80),
  baseline_deviation  NUMERIC(7,2) DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS firmware_versions (
  id              SERIAL PRIMARY KEY,
  firmware_id     VARCHAR(50) UNIQUE,
  vendor          VARCHAR(120),
  model           VARCHAR(120),
  version         VARCHAR(50),
  cve_count       INTEGER DEFAULT 0,
  latest          BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_patches (
  id              SERIAL PRIMARY KEY,
  patch_id        VARCHAR(50) UNIQUE,
  vendor          VARCHAR(120),
  advisory        VARCHAR(200),
  severity        VARCHAR(20) DEFAULT 'medium',
  affected_models VARCHAR(300),
  status          VARCHAR(30) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_windows (
  id              SERIAL PRIMARY KEY,
  window_id       VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  start_at        TIMESTAMPTZ,
  end_at          TIMESTAMPTZ,
  scope           VARCHAR(200),
  approver        VARCHAR(120),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_systems (
  id              SERIAL PRIMARY KEY,
  sis_id          VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  type            VARCHAR(60),
  sil_level       VARCHAR(10),
  last_test       DATE,
  status          VARCHAR(30) DEFAULT 'healthy',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_loops (
  id              SERIAL PRIMARY KEY,
  loop_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  asset           VARCHAR(80),
  pv_tag          VARCHAR(80),
  sp_tag          VARCHAR(80),
  status          VARCHAR(30) DEFAULT 'normal',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operator_actions (
  id              SERIAL PRIMARY KEY,
  action_id       VARCHAR(50) UNIQUE,
  operator        VARCHAR(120),
  asset           VARCHAR(80),
  action          VARCHAR(200),
  ts              TIMESTAMPTZ,
  justification   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ics_runbooks (
  id              SERIAL PRIMARY KEY,
  runbook_id      VARCHAR(50) UNIQUE,
  name            VARCHAR(200),
  category        VARCHAR(80),
  scenario        VARCHAR(300),
  version         VARCHAR(30),
  owner           VARCHAR(120),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_baselines (
  id              SERIAL PRIMARY KEY,
  baseline_id     VARCHAR(50) UNIQUE,
  zone            VARCHAR(120),
  protocol        VARCHAR(40),
  learned_at      TIMESTAMPTZ,
  drift_pct       NUMERIC(6,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'stable',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ics_iocs (
  id              SERIAL PRIMARY KEY,
  ioc_id          VARCHAR(50) UNIQUE,
  type            VARCHAR(40),
  value           VARCHAR(300),
  source          VARCHAR(120),
  confidence      VARCHAR(20),
  first_seen      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  actor           VARCHAR(120),
  target          VARCHAR(200),
  action          VARCHAR(80),
  result          VARCHAR(30),
  ts              TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Cross-cutting: RBAC users, notifications, attachments, webhooks, AI results
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password        VARCHAR(120) NOT NULL,
  name            VARCHAR(120),
  role            VARCHAR(20) DEFAULT 'viewer',  -- admin|analyst|viewer
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER,
  title           VARCHAR(200),
  body            TEXT,
  severity        VARCHAR(20) DEFAULT 'info',
  source          VARCHAR(80),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS attachments (
  id              SERIAL PRIMARY KEY,
  resource_type   VARCHAR(60),
  resource_id     INTEGER,
  filename        VARCHAR(255),
  original_name   VARCHAR(255),
  mimetype        VARCHAR(120),
  size_bytes      INTEGER,
  uploaded_by     VARCHAR(150),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_resource
  ON attachments (resource_type, resource_id);

CREATE TABLE IF NOT EXISTS webhooks (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120),
  url             VARCHAR(500),
  secret          VARCHAR(120),
  events          TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              SERIAL PRIMARY KEY,
  webhook_id      INTEGER,
  event           VARCHAR(120),
  payload         JSONB,
  status_code     INTEGER,
  response_body   TEXT,
  attempted_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
  ON webhook_deliveries (webhook_id, attempted_at DESC);

CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(80) NOT NULL,
  input           JSONB,
  output          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created
  ON ai_results (feature, created_at DESC);
