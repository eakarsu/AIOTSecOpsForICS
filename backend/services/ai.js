// AI helper service for AIOTSecOpsForICS
// Reads OPENROUTER_API_KEY and OPENROUTER_MODEL from:
//   1. this project's .env (already loaded by server.js)
//   2. fallback: /Users/erolakarsu/projects/beauty-wellness-ai/.env (canonical source)
// Never overwrites or wipes credentials.

const fs = require('fs');

const FALLBACK_ENV = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readFallbackEnv() {
  try {
    if (!fs.existsSync(FALLBACK_ENV)) return {};
    const raw = fs.readFileSync(FALLBACK_ENV, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1]] = val;
    }
    return out;
  } catch (e) {
    console.warn('[ai] fallback env read failed:', e.message);
    return {};
  }
}

function getOpenRouterCreds() {
  const fb = readFallbackEnv();
  const key = process.env.OPENROUTER_API_KEY || fb.OPENROUTER_API_KEY || '';
  const model = process.env.OPENROUTER_MODEL || fb.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  return { key, model };
}

const SYSTEM_PROMPT =
  'You are a senior OT/ICS security operations analyst supporting a SCADA/PLC/HMI environment. ' +
  'You provide rigorous, plant-grade reasoning on industrial alerts, control-system incidents, ' +
  'vendor patches, protocol anomalies, safety systems and supply-chain firmware risk. ' +
  'Always return strict JSON in the exact schema requested. Never wrap your response in markdown ' +
  'fences. Treat every input as a tabletop / lab scenario — never recommend real-world destructive ' +
  'actions or share exploit code.';

function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve) => {
    const { key, model } = getOpenRouterCreds();
    if (!key) {
      return resolve({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const https = require('https');
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3060',
        'X-Title': 'AIOTSecOpsForICS',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return resolve({ error: parsed.error.message || 'OpenRouter error', raw: body });
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          resolve({ error: 'AI response parse failed', raw: body });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();
  try { return JSON.parse(text); } catch (_) {}
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) {}
  return { ...fallback, summary: text };
}

// ──────────────────────────────────────────────────────────────
// 1. Triage ICS Alert
// ──────────────────────────────────────────────────────────────
async function triageIcsAlert(alert, context = {}) {
  const sys = `${SYSTEM_PROMPT} Triage a single ICS alert. Return strict JSON:
{
  "verdict": "true_positive"|"false_positive"|"benign"|"needs_more_info",
  "confidence": number,
  "severity": "low"|"medium"|"high"|"critical",
  "affected_asset": string,
  "purdue_level": string,
  "kill_chain_stage": string,
  "rationale": string,
  "immediate_actions": [string],
  "indicators_to_collect": [string],
  "escalation": { "to": string, "priority": "low"|"medium"|"high"|"critical" },
  "summary": string
}`;
  const usr = `Alert:\n${JSON.stringify(alert, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', immediate_actions: [] });
}

// ──────────────────────────────────────────────────────────────
// 2. Baseline Protocol
// ──────────────────────────────────────────────────────────────
async function baselineProtocol(zone, protocol, observation = {}) {
  const sys = `${SYSTEM_PROMPT} Build a normal-traffic baseline for an industrial protocol in a zone. Return strict JSON:
{
  "zone": string,
  "protocol": string,
  "normal_flows": [{ "src": string, "dst": string, "function_codes": [string], "typical_rate_per_min": number }],
  "abnormal_patterns": [{ "pattern": string, "severity": "low"|"medium"|"high"|"critical", "narrative": string }],
  "recommended_thresholds": [{ "metric": string, "warn": number, "alert": number }],
  "drift_assessment": { "drift_pct": number, "status": "stable"|"drifting"|"breach", "narrative": string },
  "summary": string
}`;
  const usr = `Zone: ${zone}\nProtocol: ${protocol}\nObservation:\n${JSON.stringify(observation, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', normal_flows: [] });
}

// ──────────────────────────────────────────────────────────────
// 3. Classify Incident
// ──────────────────────────────────────────────────────────────
async function classifyIncident(incident, context = {}) {
  const sys = `${SYSTEM_PROMPT} Classify an ICS incident. Return strict JSON:
{
  "incident_class": string,
  "tactics": [string],
  "techniques": [{ "id": string, "name": string }],
  "impact_category": "safety"|"availability"|"integrity"|"confidentiality"|"mixed",
  "severity": "low"|"medium"|"high"|"critical",
  "recommended_runbook": string,
  "stakeholders_to_notify": [string],
  "rationale": string,
  "summary": string
}`;
  const usr = `Incident:\n${JSON.stringify(incident, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', techniques: [] });
}

// ──────────────────────────────────────────────────────────────
// 4. Suggest Isolation
// ──────────────────────────────────────────────────────────────
async function suggestIsolation(target, context = {}) {
  const sys = `${SYSTEM_PROMPT} Recommend a containment / isolation plan for a compromised OT asset or zone. Return strict JSON:
{
  "target": string,
  "isolation_options": [{ "option": string, "blast_radius": "small"|"medium"|"large", "process_impact": "none"|"low"|"medium"|"high"|"critical", "reversibility": "easy"|"moderate"|"hard", "narrative": string }],
  "recommended_option": string,
  "preconditions": [string],
  "rollback_plan": [string],
  "process_safety_check": { "required": boolean, "notes": string },
  "summary": string
}`;
  const usr = `Target: ${target}\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', isolation_options: [] });
}

// ──────────────────────────────────────────────────────────────
// 5. Draft Change Procedure
// ──────────────────────────────────────────────────────────────
async function draftChangeProcedure(scope, constraints = {}) {
  const sys = `${SYSTEM_PROMPT} Draft a Management-of-Change procedure for an OT/ICS change. Return strict JSON:
{
  "title": string,
  "scope": string,
  "pre_change_tasks": [string],
  "execution_steps": [{ "step": number, "action": string, "owner": string, "expected_duration_min": number, "verification": string }],
  "rollback_steps": [string],
  "approvals_required": [string],
  "process_safety_impact": "none"|"low"|"medium"|"high"|"critical",
  "estimated_duration_minutes": number,
  "summary": string
}`;
  const usr = `Scope: ${scope}\nConstraints:\n${JSON.stringify(constraints, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', execution_steps: [] });
}

// ──────────────────────────────────────────────────────────────
// 6. Vendor Patch Impact
// ──────────────────────────────────────────────────────────────
async function vendorPatchImpact(patch, fleet = []) {
  const sys = `${SYSTEM_PROMPT} Assess the impact of a vendor patch on the installed OT fleet. Return strict JSON:
{
  "advisory": string,
  "affected_assets": [{ "asset_id": string, "model": string, "vendor": string, "exposure": "confirmed"|"likely"|"unlikely" }],
  "operational_risk": "low"|"medium"|"high"|"critical",
  "patch_window_recommendation": string,
  "compensating_controls": [string],
  "patch_priority": "deferred"|"normal"|"urgent"|"emergency",
  "summary": string
}`;
  const usr = `Patch:\n${JSON.stringify(patch, null, 2)}\n\nFleet sample:\n${JSON.stringify(fleet, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', affected_assets: [] });
}

// ──────────────────────────────────────────────────────────────
// 7. Control Loop Anomaly
// ──────────────────────────────────────────────────────────────
async function controlLoopAnomaly(loop, telemetry = {}) {
  const sys = `${SYSTEM_PROMPT} Diagnose a control-loop anomaly. Return strict JSON:
{
  "loop_id": string,
  "verdict": "normal"|"oscillating"|"frozen"|"saturated"|"drifting"|"suspicious",
  "likely_root_causes": [{ "cause": string, "confidence": number, "narrative": string }],
  "process_safety_concern": boolean,
  "recommended_actions": [string],
  "monitoring_recommendations": [string],
  "summary": string
}`;
  const usr = `Loop:\n${JSON.stringify(loop, null, 2)}\n\nTelemetry:\n${JSON.stringify(telemetry, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', likely_root_causes: [] });
}

// ──────────────────────────────────────────────────────────────
// 8. Safety Impact
// ──────────────────────────────────────────────────────────────
async function safetyImpact(eventDescription, context = {}) {
  const sys = `${SYSTEM_PROMPT} Assess the process-safety impact of a cyber event. Return strict JSON:
{
  "event": string,
  "safety_layers_affected": [{ "layer": string, "status": "intact"|"degraded"|"defeated", "narrative": string }],
  "sil_credit_impact": string,
  "worst_case_consequence": string,
  "barriers_remaining": [string],
  "immediate_safety_actions": [string],
  "regulatory_notification_required": boolean,
  "summary": string
}`;
  const usr = `Event: ${eventDescription}\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', safety_layers_affected: [] });
}

// ──────────────────────────────────────────────────────────────
// 9. Executive Brief
// ──────────────────────────────────────────────────────────────
async function executiveBrief(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a CISO-level OT/ICS security brief. Return strict JSON:
{
  "headline": string,
  "operational_picture": string,
  "alert_health": { "open": number, "critical": number, "trend": "improving"|"steady"|"degrading", "narrative": string },
  "incident_status": [{ "incident": string, "status": string, "notes": string }],
  "top_risks": [{ "risk": string, "severity": "low"|"medium"|"high"|"critical", "owner": string }],
  "decisions_required": [{ "decision": string, "deadline": string, "options": [string], "recommendation": string }],
  "next_72h_outlook": string,
  "summary": string
}`;
  const usr = `Operational snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// ──────────────────────────────────────────────────────────────
// 10. Hunt Attack Path
// ──────────────────────────────────────────────────────────────
async function huntAttackPath(hypothesis, context = {}) {
  const sys = `${SYSTEM_PROMPT} Walk an attacker's likely path through an OT environment given a hypothesis. Return strict JSON:
{
  "hypothesis": string,
  "attack_path": [{ "step": number, "zone": string, "asset": string, "technique": string, "detection_opportunity": string }],
  "pivot_points": [string],
  "detection_gaps": [string],
  "recommended_hunts": [string],
  "confidence": number,
  "summary": string
}`;
  const usr = `Hypothesis: ${hypothesis}\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', attack_path: [] });
}

// ──────────────────────────────────────────────────────────────
// 11. Asset Criticality
// ──────────────────────────────────────────────────────────────
async function assetCriticality(asset, context = {}) {
  const sys = `${SYSTEM_PROMPT} Rate the criticality of an OT asset using a Purdue + impact lens. Return strict JSON:
{
  "asset_id": string,
  "criticality": "low"|"medium"|"high"|"critical",
  "score": number,
  "factors": [{ "factor": string, "weight": number, "narrative": string }],
  "downstream_dependencies": [string],
  "monitoring_recommendations": [string],
  "summary": string
}`;
  const usr = `Asset:\n${JSON.stringify(asset, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', factors: [] });
}

// ──────────────────────────────────────────────────────────────
// 12. Network Segmentation
// ──────────────────────────────────────────────────────────────
async function networkSegmentation(zones = [], constraints = {}) {
  const sys = `${SYSTEM_PROMPT} Recommend network segmentation improvements across Purdue levels. Return strict JSON:
{
  "current_posture": string,
  "recommendations": [{ "from_zone": string, "to_zone": string, "action": "block"|"restrict"|"monitor"|"allow", "protocol": string, "rationale": string }],
  "quick_wins": [string],
  "longer_term_program": [string],
  "expected_risk_reduction": "low"|"medium"|"high",
  "summary": string
}`;
  const usr = `Zones:\n${JSON.stringify(zones, null, 2)}\n\nConstraints:\n${JSON.stringify(constraints, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recommendations: [] });
}

// ──────────────────────────────────────────────────────────────
// 13. Malicious Firmware Detect
// ──────────────────────────────────────────────────────────────
async function maliciousFirmwareDetect(sample, context = {}) {
  const sys = `${SYSTEM_PROMPT} Assess whether a firmware sample shows tampering signs. Return strict JSON:
{
  "verdict": "clean"|"suspect"|"likely_malicious"|"malicious",
  "confidence": number,
  "indicators": [{ "indicator": string, "weight": "low"|"medium"|"high", "narrative": string }],
  "vendor_authenticity": "verified"|"unverified"|"failed",
  "recommended_response": [string],
  "containment_priority": "low"|"medium"|"high"|"critical",
  "summary": string
}`;
  const usr = `Firmware sample:\n${JSON.stringify(sample, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', indicators: [] });
}

// ──────────────────────────────────────────────────────────────
// 14. Operator Action Review
// ──────────────────────────────────────────────────────────────
async function operatorActionReview(actions = [], context = {}) {
  const sys = `${SYSTEM_PROMPT} Review a batch of operator actions for suspicious or out-of-policy behavior. Return strict JSON:
{
  "reviewed_count": number,
  "flagged": [{ "action_id": string, "operator": string, "reason": string, "severity": "low"|"medium"|"high"|"critical" }],
  "policy_violations": [{ "policy": string, "count": number }],
  "training_recommendations": [string],
  "summary": string
}`;
  const usr = `Operator actions:\n${JSON.stringify(actions, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', flagged: [] });
}

// ──────────────────────────────────────────────────────────────
// 15. MITRE ATT&CK for ICS Mapper
// ──────────────────────────────────────────────────────────────
async function mitreIcsMapper(observations = [], context = {}) {
  const sys = `${SYSTEM_PROMPT} Map observed activity to MITRE ATT&CK for ICS. Return strict JSON:
{
  "mappings": [{ "observation": string, "tactic": string, "technique_id": string, "technique_name": string, "confidence": number }],
  "coverage_gaps": [string],
  "highest_risk_techniques": [string],
  "detection_recommendations": [string],
  "summary": string
}`;
  const usr = `Observations:\n${JSON.stringify(observations, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', mappings: [] });
}

// ──────────────────────────────────────────────────────────────
// 16. Supply-Chain Firmware Risk
// ──────────────────────────────────────────────────────────────
async function supplyChainFirmware(vendors = [], context = {}) {
  const sys = `${SYSTEM_PROMPT} Assess vendor / firmware supply-chain risk across the fleet. Return strict JSON:
{
  "vendor_risk": [{ "vendor": string, "risk": "low"|"medium"|"high"|"critical", "rationale": string }],
  "high_risk_components": [{ "component": string, "vendor": string, "why": string }],
  "recommended_controls": [string],
  "monitoring_indicators": [string],
  "overall_posture": "weak"|"adequate"|"strong",
  "summary": string
}`;
  const usr = `Vendors:\n${JSON.stringify(vendors, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', vendor_risk: [] });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  triageIcsAlert,
  baselineProtocol,
  classifyIncident,
  suggestIsolation,
  draftChangeProcedure,
  vendorPatchImpact,
  controlLoopAnomaly,
  safetyImpact,
  executiveBrief,
  huntAttackPath,
  assetCriticality,
  networkSegmentation,
  maliciousFirmwareDetect,
  operatorActionReview,
  mitreIcsMapper,
  supplyChainFirmware,
};
