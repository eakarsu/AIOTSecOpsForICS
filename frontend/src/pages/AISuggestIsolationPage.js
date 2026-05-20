import React from 'react';
import AIPage from '../components/AIPage';
import { aiSuggestIsolation } from '../services/api';

export default function AISuggestIsolationPage() {
  return (
    <AIPage
      title="AI · Suggest Isolation"
      feature="suggest-isolation"
      subtitle="Containment options weighed against process impact and reversibility."
      inputs={[
        { key: 'target', label: 'Target (asset or zone)',
          placeholder: 'e.g. PLC-1004 (AC 800M PM866, Generator Hall)' },
        { key: 'notes',  label: 'Context Notes', type: 'textarea',
          placeholder: 'Why isolation is being considered, what must keep running.' },
      ]}
      run={(v) => aiSuggestIsolation({ target: v.target, notes: v.notes })}
    />
  );
}
