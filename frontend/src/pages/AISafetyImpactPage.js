import React from 'react';
import AIPage from '../components/AIPage';
import { aiSafetyImpact } from '../services/api';

export default function AISafetyImpactPage() {
  return (
    <AIPage
      title="AI · Safety Impact"
      feature="safety-impact"
      subtitle="Assess process-safety impact of a cyber event (layers, barriers, notifications)."
      inputs={[
        { key: 'event', label: 'Event Description', type: 'textarea',
          placeholder: 'e.g. SIS-2204 forced into bypass for 4 minutes during unauthorized Modbus writes to PLC-1004.' },
      ]}
      run={(v) => aiSafetyImpact({ event: v.event })}
    />
  );
}
