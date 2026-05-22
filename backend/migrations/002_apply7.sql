-- AIOTSecOpsForICS — Apply pass 7 (full backlog implementation) schema delta.
--
-- All OT-safety-critical AI outputs are advisory only. Tables here store
-- ingestion + audit + authoring state for the new endpoints; no automated
-- mitigation paths are wired.

-- ─────────────────────────────────────────────
-- Zone authoring: conduits between network_zones
-- (network_zones already exists; this adds the conduit edges + an authoring
-- changelog so the zone editor UI has a write surface.)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS network_conduits (
  id              SERIAL PRIMARY KEY,
  conduit_id      VARCHAR(50) UNIQUE,
  src_zone_id     VARCHAR(50),
  dst_zone_id     VARCHAR(50),
  protocols       TEXT,              -- comma-separated, e.g. "Modbus,OPC UA"
  direction       VARCHAR(20) DEFAULT 'bidirectional', -- in|out|bidirectional
  posture         VARCHAR(20) DEFAULT 'allow',          -- allow|inspect|block
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_network_conduits_src ON network_conduits (src_zone_id);
CREATE INDEX IF NOT EXISTS idx_network_conduits_dst ON network_conduits (dst_zone_id);

-- ─────────────────────────────────────────────
-- Change-window approvals — workflow on top of change_windows
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_window_approvals (
  id              SERIAL PRIMARY KEY,
  window_id       VARCHAR(50),
  approver        VARCHAR(150),
  decision        VARCHAR(20),       -- requested|approved|rejected|withdrawn
  reason          TEXT,
  decided_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_change_window_approvals_window
  ON change_window_approvals (window_id, decided_at DESC);

-- ─────────────────────────────────────────────
-- SIS audit register — SIL verification trail + proof tests + bypass/override
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sis_audit_entries (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  sis_id          VARCHAR(50),       -- references safety_systems.sis_id
  entry_type      VARCHAR(40),       -- sil_verification|proof_test|bypass|override|return_to_service
  sil_level       VARCHAR(10),       -- SIL1..SIL4 (free-form)
  performed_by    VARCHAR(150),
  performed_at    TIMESTAMPTZ,
  result          VARCHAR(40),       -- pass|fail|partial|deferred|bypass_open|bypass_closed
  next_due_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sis_audit_entries_sis
  ON sis_audit_entries (sis_id, performed_at DESC);

-- ─────────────────────────────────────────────
-- Vendor advisory ingest — staged feed before promotion into vendor_patches
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_advisories (
  id              SERIAL PRIMARY KEY,
  advisory_id     VARCHAR(80) UNIQUE,
  source          VARCHAR(60),       -- ICS-CERT|Siemens|Schneider|Rockwell|manual
  vendor          VARCHAR(120),
  title           VARCHAR(300),
  severity        VARCHAR(20) DEFAULT 'medium',
  cve_ids         TEXT,              -- comma-separated CVE IDs
  affected        TEXT,              -- free-form affected products/versions
  url             VARCHAR(500),
  published_at    TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'new', -- new|reviewed|promoted|dismissed
  promoted_patch_id VARCHAR(50),     -- vendor_patches.patch_id once promoted
  raw             JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendor_advisories_source
  ON vendor_advisories (source, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_advisories_status
  ON vendor_advisories (status);
