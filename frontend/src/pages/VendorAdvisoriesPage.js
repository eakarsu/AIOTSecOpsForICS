import React, { useState } from 'react';
import CrudPage from '../components/CrudPage';
import { vendorAdvisoriesApi } from '../services/api';

// Apply pass 7 — Vendor advisory ingest. Manual CRUD + "Pull Live" button
// (currently returns 503 stub until ICS-CERT / vendor portal creds are wired).
const api = {
  list:   ()      => vendorAdvisoriesApi.list(),
  get:    (id)    => vendorAdvisoriesApi.get(id),
  create: (d)     => vendorAdvisoriesApi.create(d),
  update: (id, d) => vendorAdvisoriesApi.update(id, d),
  remove: (id)    => vendorAdvisoriesApi.remove(id),
};

export default function VendorAdvisoriesPage() {
  const [busy, setBusy] = useState(false);
  const [pullResult, setPullResult] = useState(null);

  const handlePullLive = async () => {
    setBusy(true);
    setPullResult(null);
    try {
      const r = await vendorAdvisoriesApi.pullLive();
      setPullResult({ ok: true, data: r });
    } catch (e) {
      setPullResult({ ok: false, error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Live feed (ICS-CERT / Siemens / Schneider / Rockwell):</span>
          <button className="btn ai" onClick={handlePullLive} disabled={busy}>
            {busy ? 'Pulling...' : 'Pull Live Advisories'}
          </button>
          <span style={{ color: '#888', fontSize: 13 }}>
            Returns 503 until vendor-portal credentials are provisioned. Use the form below to ingest manually.
          </span>
        </div>
        {pullResult && (
          <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
            {pullResult.ok ? JSON.stringify(pullResult.data, null, 2) : `Error: ${pullResult.error}`}
          </div>
        )}
      </div>
      <CrudPage
        title="Vendor Advisory Ingest"
        subtitle="Manual ingest + promotion into vendor_patches. Advisory only — promotion does not auto-schedule patching."
        api={api}
        statusKey="status"
        fields={[
          { key: 'advisory_id',  label: 'Advisory ID' },
          { key: 'source',       label: 'Source', type: 'select',
            options: ['ICS-CERT','Siemens','Schneider','Rockwell','HIMA','ABB','manual','other'] },
          { key: 'vendor',       label: 'Vendor' },
          { key: 'title',        label: 'Title' },
          { key: 'severity',     label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
          { key: 'cve_ids',      label: 'CVE IDs (comma-separated)' },
          { key: 'affected',     label: 'Affected', type: 'textarea' },
          { key: 'url',          label: 'URL' },
          { key: 'published_at', label: 'Published At', type: 'datetime-local' },
          { key: 'status',       label: 'Status', type: 'select', options: ['new','reviewed','promoted','dismissed'] },
        ]}
      />
    </div>
  );
}
