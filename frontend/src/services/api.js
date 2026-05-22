const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  'http://localhost:3061/api';

export { API_BASE };

const TOKEN_KEY = 'otsec_token';
const USER_KEY  = 'otsec_user';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
export function logout() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

// Role helpers
export function getRole() {
  return (getStoredUser()?.role || 'viewer').toLowerCase();
}
export function canWrite() {
  return ['admin', 'analyst'].includes(getRole());
}
export function isAdmin() {
  return getRole() === 'admin';
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }

  if (res.status === 401) {
    if (!url.startsWith('/auth/login')) {
      logout();
      throw new Error('Session expired');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Generic CRUD factory
function crud(base) {
  return {
    list:   ()       => request(`/${base}`),
    get:    (id)     => request(`/${base}/${id}`),
    create: (data)   => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d)  => request(`/${base}/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    remove: (id)     => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

// 18 CRUD helpers
export const otAssetsApi          = crud('ot-assets');
export const plcsApi              = crud('plcs');
export const hmisApi              = crud('hmis');
export const scadaServersApi      = crud('scada-servers');
export const icsAlertsApi         = crud('ics-alerts');
export const icsIncidentsApi      = crud('ics-incidents');
export const networkZonesApi      = crud('network-zones');
export const protocolAnomaliesApi = crud('protocol-anomalies');
export const firmwareVersionsApi  = crud('firmware-versions');
export const vendorPatchesApi     = crud('vendor-patches');
export const changeWindowsApi     = crud('change-windows');
export const safetySystemsApi     = crud('safety-systems');
export const controlLoopsApi      = crud('control-loops');
export const operatorActionsApi   = crud('operator-actions');
export const icsRunbooksApi       = crud('ics-runbooks');
export const networkBaselinesApi  = crud('network-baselines');
export const icsIocsApi           = crud('ics-iocs');
export const auditLogApi          = crud('audit-log');

// Dashboard
export const getDashboardStats = () => request('/dashboard');

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

// AI endpoints — 16 verbs
export const aiTriageIcsAlert         = (body) => request('/ai/triage-ics-alert',         { method: 'POST', body: JSON.stringify(body || {}) });
export const aiBaselineProtocol       = (body) => request('/ai/baseline-protocol',        { method: 'POST', body: JSON.stringify(body || {}) });
export const aiClassifyIncident       = (body) => request('/ai/classify-incident',        { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSuggestIsolation       = (body) => request('/ai/suggest-isolation',        { method: 'POST', body: JSON.stringify(body || {}) });
export const aiDraftChangeProcedure   = (body) => request('/ai/draft-change-procedure',   { method: 'POST', body: JSON.stringify(body || {}) });
export const aiVendorPatchImpact      = (body) => request('/ai/vendor-patch-impact',      { method: 'POST', body: JSON.stringify(body || {}) });
export const aiControlLoopAnomaly     = (body) => request('/ai/control-loop-anomaly',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSafetyImpact           = (body) => request('/ai/safety-impact',            { method: 'POST', body: JSON.stringify(body || {}) });
export const aiExecutiveBrief         = (body) => request('/ai/executive-brief',          { method: 'POST', body: JSON.stringify(body || {}) });
export const aiHuntAttackPath         = (body) => request('/ai/hunt-attack-path',         { method: 'POST', body: JSON.stringify(body || {}) });
export const aiAssetCriticality       = (body) => request('/ai/asset-criticality',        { method: 'POST', body: JSON.stringify(body || {}) });
export const aiNetworkSegmentation    = (body) => request('/ai/network-segmentation',     { method: 'POST', body: JSON.stringify(body || {}) });
export const aiMaliciousFirmwareDetect= (body) => request('/ai/malicious-firmware-detect',{ method: 'POST', body: JSON.stringify(body || {}) });
export const aiOperatorActionReview   = (body) => request('/ai/operator-action-review',   { method: 'POST', body: JSON.stringify(body || {}) });
export const aiMitreIcsMapper         = (body) => request('/ai/mitre-ics-mapper',         { method: 'POST', body: JSON.stringify(body || {}) });
export const aiSupplyChainFirmware    = (body) => request('/ai/supply-chain-firmware',    { method: 'POST', body: JSON.stringify(body || {}) });

// AI history
export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({
    ...(feature ? { feature } : {}),
    limit: String(limit),
  }).toString();
  return request(`/ai/history?${qs}`);
};

// AI sample fills
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

// Notifications
export const getNotifications       = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead   = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

// ─── Apply pass 7 (full backlog implementation) ───
// All AI v2 / authoring endpoints are ADVISORY ONLY for OT safety-critical
// decisions. UI must not act on them automatically.

// AI v2 endpoints — 4 verbs
export const aiParseProtocolPayload   = (body) => request('/ai-v2/parse-protocol-payload',   { method: 'POST', body: JSON.stringify(body || {}) });
export const aiClassifyAsset          = (body) => request('/ai-v2/classify-asset',           { method: 'POST', body: JSON.stringify(body || {}) });
export const aiLateralMovementNarrative = (body) => request('/ai-v2/lateral-movement-narrative', { method: 'POST', body: JSON.stringify(body || {}) });
export const aiPrioritizeVulns        = (body) => request('/ai-v2/prioritize-vulns',         { method: 'POST', body: JSON.stringify(body || {}) });
export const getAIV2Samples = (feature) =>
  request(`/ai-v2/samples?${new URLSearchParams({ feature: feature || '' }).toString()}`);

// Zone editor (network conduits)
export const networkConduitsApi = crud('network-conduits');

// Change-window approvals
export const changeWindowApprovalsApi = {
  list:        (windowId) => request(`/change-window-approvals${windowId ? `?window_id=${encodeURIComponent(windowId)}` : ''}`),
  request:     (d)         => request('/change-window-approvals/request', { method: 'POST', body: JSON.stringify(d) }),
  decide:      (id, d)     => request(`/change-window-approvals/${id}/decide`, { method: 'POST', body: JSON.stringify(d) }),
  conflicts:   ()          => request('/change-window-approvals/conflicts'),
  calendar:    (from, to)  => {
    const qs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
    return request(`/change-window-approvals/calendar${qs ? `?${qs}` : ''}`);
  },
};

// SIS audit register
export const sisAuditApi = {
  list:    (q = {}) => {
    const qs = new URLSearchParams(q).toString();
    return request(`/sis-audit${qs ? `?${qs}` : ''}`);
  },
  get:     (id)    => request(`/sis-audit/${id}`),
  create:  (d)     => request('/sis-audit', { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d) => request(`/sis-audit/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove:  (id)    => request(`/sis-audit/${id}`, { method: 'DELETE' }),
  bypassRegister:   () => request('/sis-audit/views/bypass-register'),
  proofTestSchedule: (days = 90) => request(`/sis-audit/views/proof-test-schedule?days=${days}`),
};

// Vendor advisory ingest
export const vendorAdvisoriesApi = {
  list:    (q = {}) => {
    const qs = new URLSearchParams(q).toString();
    return request(`/vendor-advisories${qs ? `?${qs}` : ''}`);
  },
  get:     (id)    => request(`/vendor-advisories/${id}`),
  create:  (d)     => request('/vendor-advisories', { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d) => request(`/vendor-advisories/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove:  (id)    => request(`/vendor-advisories/${id}`, { method: 'DELETE' }),
  promote: (id)    => request(`/vendor-advisories/${id}/promote`, { method: 'POST', body: '{}' }),
  pullLive:()      => request('/vendor-advisories/pull-live', { method: 'POST', body: '{}' }),
};

// Webhooks
export const webhooksApi = {
  list:    ()         => request('/webhooks'),
  create:  (d)        => request('/webhooks',          { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)    => request(`/webhooks/${id}`,    { method: 'PUT',  body: JSON.stringify(d) }),
  remove:  (id)       => request(`/webhooks/${id}`,    { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ event, payload }),
  }),
  deliveries: (id)    => request(`/webhooks/${id}/deliveries`),
};
