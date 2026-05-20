import React from 'react';
import AIPage from '../components/AIPage';
import { aiClassifyIncident } from '../services/api';

export default function AIClassifyIncidentPage() {
  return (
    <AIPage
      title="AI · Classify Incident"
      feature="classify-incident"
      subtitle="Classify an ICS incident, map techniques and recommend a runbook."
      inputs={[
        { key: 'incident_text', label: 'Incident (free-form)', type: 'textarea',
          placeholder: 'e.g. Off-hours Modbus write to refinery PLC from engineering WS; no change window open.' },
        { key: 'context_notes', label: 'Context Notes', type: 'textarea',
          placeholder: 'Related alerts, prior incidents, vendor info.' },
      ]}
      run={(v) => aiClassifyIncident({ incident_text: v.incident_text, context: { notes: v.context_notes } })}
    />
  );
}
