import React from 'react';
import AIPage from '../components/AIPage';
import { aiControlLoopAnomaly } from '../services/api';

export default function AIControlLoopAnomalyPage() {
  return (
    <AIPage
      title="AI · Control Loop Anomaly"
      feature="control-loop-anomaly"
      subtitle="Diagnose loop oscillation / freeze / saturation / suspicious behavior."
      inputs={[
        { key: 'loop_id',         label: 'Loop ID',
          placeholder: 'e.g. LP-3304' },
        { key: 'telemetry_notes', label: 'Telemetry Notes', type: 'textarea',
          placeholder: 'What you see on PV / SP / CV recently.' },
      ]}
      run={(v) => aiControlLoopAnomaly({ loop_id: v.loop_id, telemetry_notes: v.telemetry_notes })}
    />
  );
}
