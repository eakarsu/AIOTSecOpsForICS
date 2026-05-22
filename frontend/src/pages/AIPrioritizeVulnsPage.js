import React from 'react';
import AIPage from '../components/AIPage';
import { aiPrioritizeVulns, getAIV2Samples } from '../services/api';

export default function AIPrioritizeVulnsPage() {
  return (
    <AIPage
      title="AI · OT-Context Vuln Prioritizer"
      feature="prioritize-vulns"
      samplesFn={getAIV2Samples}
      subtitle="Rank pending CVEs against the fleet by criticality × exposure × safety impact. Advisory only — never auto-deploys patches."
      inputs={[
        { key: 'focus', label: 'Focus / Scope', type: 'textarea',
          placeholder: 'e.g. Restrict to safety systems, or to internet-adjacent assets, or to refinery cells.' },
      ]}
      run={(v) => aiPrioritizeVulns({ focus: v.focus })}
    />
  );
}
