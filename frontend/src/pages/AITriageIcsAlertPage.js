import React from 'react';
import AIPage from '../components/AIPage';
import { aiTriageIcsAlert } from '../services/api';

export default function AITriageIcsAlertPage() {
  return (
    <AIPage
      title="AI · Triage ICS Alert"
      feature="triage-ics-alert"
      subtitle="Triage a single ICS alert with rationale, kill-chain stage and recommended actions."
      inputs={[
        { key: 'alert_text', label: 'Alert (free-form)', type: 'textarea',
          placeholder: 'e.g. Modbus function code 0x10 write to PLC-1001 at 03:14 UTC from engineering WS; no change window.' },
        { key: 'context_notes', label: 'Context Notes', type: 'textarea',
          placeholder: 'Recent changes, related incidents, vendor advisories etc.' },
      ]}
      run={(v) => aiTriageIcsAlert({ alert_text: v.alert_text, context: { notes: v.context_notes } })}
    />
  );
}
