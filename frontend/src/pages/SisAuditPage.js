import React from 'react';
import CrudPage from '../components/CrudPage';
import { sisAuditApi } from '../services/api';

// Apply pass 7 — SIS audit register (SIL verification, proof tests, bypass/override).
// Wraps the dedicated routes through a CrudPage by passing the sisAuditApi
// shape (which exposes list/get/create/update/remove already). Advisory only.
const api = {
  list:   ()      => sisAuditApi.list(),
  get:    (id)    => sisAuditApi.get(id),
  create: (d)     => sisAuditApi.create(d),
  update: (id, d) => sisAuditApi.update(id, d),
  remove: (id)    => sisAuditApi.remove(id),
};

export default function SisAuditPage() {
  return (
    <CrudPage
      title="SIS Audit Register"
      subtitle="Safety-Instrumented-System SIL verification, proof tests and bypass/override register. Advisory only."
      api={api}
      statusKey="result"
      fields={[
        { key: 'entry_id',     label: 'Entry ID' },
        { key: 'sis_id',       label: 'SIS ID' },
        { key: 'entry_type',   label: 'Entry Type',
          type: 'select',
          options: ['sil_verification','proof_test','bypass','override','return_to_service'] },
        { key: 'sil_level',    label: 'SIL Level', type: 'select', options: ['SIL1','SIL2','SIL3','SIL4'] },
        { key: 'performed_by', label: 'Performed By' },
        { key: 'performed_at', label: 'Performed At', type: 'datetime-local' },
        { key: 'result',       label: 'Result',
          type: 'select',
          options: ['pass','fail','partial','deferred','bypass_open','bypass_closed'] },
        { key: 'next_due_at',  label: 'Next Due At', type: 'datetime-local' },
        { key: 'notes',        label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
