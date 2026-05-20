import React from 'react';
import AIPage from '../components/AIPage';
import { aiExecutiveBrief } from '../services/api';

export default function AIExecutiveBriefPage() {
  return (
    <AIPage
      title="AI · Executive Brief"
      feature="executive-brief"
      subtitle="CISO-level OT/ICS security snapshot, decisions and 72hr outlook."
      inputs={[
        { key: 'notes', label: 'Optional CISO notes', type: 'textarea',
          placeholder: 'Add guidance to bias the brief (e.g. focus on patch backlog).' },
      ]}
      run={(v) => aiExecutiveBrief({ notes: v.notes })}
      buttonLabel="Generate Brief"
    />
  );
}
