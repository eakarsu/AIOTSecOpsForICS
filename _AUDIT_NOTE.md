# Audit Note — AIOTSecOpsForICS

Stack: Node + Express + React + Postgres + OpenRouter.
Domain: OT/ICS security ops — SCADA/PLC/DCS asset inventory, protocol anomaly,
MITRE ATT&CK for ICS, change windows, safety systems.

## Current Surface (catalogued)

### CRUD routes (18, via `_crudFactory` w/ RBAC + bulk-import + attachments)
`ot-assets`, `plcs`, `hmis`, `scada-servers`, `ics-alerts`, `ics-incidents`,
`network-zones`, `protocol-anomalies`, `firmware-versions`, `vendor-patches`,
`change-windows`, `safety-systems`, `control-loops`, `operator-actions`,
`ics-runbooks`, `network-baselines`, `ics-iocs`, `audit-log`.

### AI routes under `/api/ai` (16 verbs + history + samples)
`triage-ics-alert`, `baseline-protocol`, `classify-incident`,
`suggest-isolation`, `draft-change-procedure`, `vendor-patch-impact`,
`control-loop-anomaly`, `safety-impact`, `executive-brief`,
`hunt-attack-path`, `asset-criticality`, `network-segmentation`,
`malicious-firmware-detect`, `operator-action-review`, `mitre-ics-mapper`,
`supply-chain-firmware`.

### Cross-cutting
`auth`, `notifications`, `attachments`, `webhooks`, `dashboard`,
`custom-views` (Purdue diagram, anomaly timeline).

## Gap Analysis — Recommendations (advisory only; OT safety-critical)

### Missing AI Counterparts
- **Protocol anomaly detector per-protocol** — Modbus / DNP3 / IEC 61850 GOOSE/SV
  deep-parse + behavioral diff (current `baseline-protocol` is generic).
- **Asset auto-classifier** — fingerprint → vendor/model/role/Purdue-level
  inference from passive traffic metadata.
- **IT/OT lateral-movement narrator** — cross-domain kill-chain storyteller
  joining IT IOCs + ICS IOCs + zone crossings.
- **Vulnerability prioritizer per OT context** — CVE × asset-criticality ×
  exposure × safety-impact ranking (distinct from existing
  `vendor-patch-impact`).
- `mitre-ics-mapper` exists — verify it returns full T-IDs and sub-techniques;
  optionally add ATT&CK-for-ICS coverage heat-map endpoint.

### Missing Non-AI Features
- **Network zone diagram editor** — Purdue diagram is read-only via
  `custom-views`; add authoring CRUD for zones/conduits.
- **Isolated-net comms** — air-gapped/diode export bundle, store-and-forward
  queue for offline sites.
- **Change-window scheduler UX** — entity exists; add conflict detection,
  freeze-window calendar, approval workflow.

### Custom Features
- **Golden-image baseline compare** — firmware/config hash diff vs. approved
  golden image per device family.
- **Safety-Instrumented-System (SIS) audit** — SIL verification trail, proof-test
  scheduler, bypass/override register.
- **Vendor advisory ingest** — automated pull from ICS-CERT / Siemens ProductCERT
  / Schneider / Rockwell feeds → `vendor-patches` with affected-asset join.

## Implemented (this round)
None — audit-only.

## Apply pass 7 (full backlog implementation)

All new endpoints / pages are ADVISORY ONLY. OT safety-critical decisions
require human-in-the-loop validation; nothing here triggers automated
mitigation, patching, or firewall changes.

### Backend — new endpoints
MECHANICAL — AI verbs (LLM-based, caller-supplied payloads). Mounted at
`/api/ai-v2`:
- `POST /api/ai-v2/parse-protocol-payload` — per-protocol deep-parse
  (Modbus / DNP3 / IEC-61850 GOOSE+SV / OPC UA / EtherNet/IP / Profinet /
  S7Comm). Caller supplies hex or capture summary in `payload_text`.
- `POST /api/ai-v2/classify-asset` — fingerprint → vendor / model / role /
  Purdue level, with confidence + alternative hypotheses.
- `POST /api/ai-v2/lateral-movement-narrative` — joins IT IOCs + ICS IOCs +
  zone crossings into a cross-domain kill-chain story.
- `POST /api/ai-v2/prioritize-vulns` — ranks CVEs × asset-criticality ×
  exposure × safety-impact, distinct from `vendor-patch-impact`.
- `GET  /api/ai-v2/samples?feature=<verb>` — sample-fill payloads matching
  the existing `/api/ai/samples` contract.
- All four reuse the existing `ai_results` table for history (see
  `/api/ai/history?feature=…`).

NEEDS-PRODUCT-DECISION (reasonable defaults):
- Zone editor → `/api/network-conduits` (full CRUD via `_crudFactory`,
  authoring layer on top of read-only Purdue diagram).
- Change-window approval workflow → `/api/change-window-approvals`
  (`POST /request`, `POST /:id/decide`, `GET /conflicts`, `GET /calendar`).
  Default two-stage workflow: `requested` → `approved | rejected | withdrawn`.
- SIS audit register → `/api/sis-audit` (CRUD) + `GET
  /views/bypass-register` + `GET /views/proof-test-schedule?days=N`.
  Entry types: `sil_verification | proof_test | bypass | override |
  return_to_service`. Bypass register pairs latest bypass/return entries per
  `sis_id`.
- Vendor advisory ingest → `/api/vendor-advisories` (CRUD) + `POST
  /:id/promote` (introspects `vendor_patches` columns and inserts the
  intersected subset).

NEEDS-CREDS:
- `POST /api/vendor-advisories/pull-live` — returns **HTTP 503** with a
  structured stub describing required env vars; manual ingest is the path
  until vendor portal creds are wired.

### Backend — schema
New migration `backend/migrations/002_apply7.sql` adds:
- `network_conduits` (zone editor edges)
- `change_window_approvals` (workflow log)
- `sis_audit_entries` (SIS audit register)
- `vendor_advisories` (ingest staging before promotion to `vendor_patches`)

Loader updated in `backend/seed/seed.js` to apply 002 after 001 (idempotent
`CREATE TABLE IF NOT EXISTS`).

### Backend — wiring
- `server.js` now mounts `/api/ai-v2`, `/api/network-conduits`,
  `/api/change-window-approvals`, `/api/sis-audit`,
  `/api/vendor-advisories` before a final `/api` 404 handler.
- `services/ai.js` extended with 4 new helpers
  (`parseProtocolPayload`, `classifyAssetFromFingerprint`,
  `lateralMovementNarrative`, `prioritizeVulnerabilities`). All system
  prompts assert `"advisory_only": true` in the JSON schema.

### Frontend — new pages
- `AIParseProtocolPayloadPage.js` → `/ai/parse-protocol-payload`
- `AIClassifyAssetPage.js` → `/ai/classify-asset`
- `AILateralMovementNarrativePage.js` → `/ai/lateral-movement-narrative`
- `AIPrioritizeVulnsPage.js` → `/ai/prioritize-vulns`
- `NetworkConduitsPage.js` → `/network-conduits`
- `ChangeWindowApprovalsPage.js` → `/change-window-approvals` (request /
  decide / conflicts / calendar)
- `SisAuditPage.js` → `/sis-audit`
- `VendorAdvisoriesPage.js` → `/vendor-advisories` (with "Pull Live" button
  that surfaces the 503 stub payload)

`AIPage.js` extended with an optional `samplesFn` prop so v2 pages can load
samples from `/api/ai-v2/samples` instead of `/api/ai/samples`.

Sidebar gets two new groups: `AI · Deep Analysis` (4 entries) and
`Authoring & Audit` (4 entries).

### Skipped (intentional)
- Live ICS-CERT / Siemens ProductCERT / Schneider / Rockwell feed pull —
  503 stub only (NEEDS-CREDS).
- No new npm dependencies added (constraint).
- Existing routes, schemas and pages were not modified beyond append-only
  wiring (no breaking changes).
- Visual Purdue editor (drag-and-drop diagram) → represented as conduit
  CRUD; the diagram-render side stays read-only in `customViews` per its
  original contract.
- Per-protocol parser is LLM-based on caller-supplied payloads (no PCAP
  dissection libraries pulled in — that would require new deps).

## Status
- Routes catalogued: 18 CRUD + 16 AI + 6 cross-cutting + **5 new (apply 7)**.
- New AI verbs: **4** (under `/api/ai-v2`). New non-AI route groups: **4**.
- DB tables: 24 + **4 new** (`network_conduits`, `change_window_approvals`,
  `sis_audit_entries`, `vendor_advisories`).
- Frontend pages: 16 AI + 18 CRUD + Dashboard + 2 Codex + **8 new**
  (4 AI v2 + 4 authoring/audit).
- All AI v2 schemas embed `"advisory_only": true` to enforce the
  human-in-the-loop posture.
- `node --check` clean on all modified / new `.js` files.
