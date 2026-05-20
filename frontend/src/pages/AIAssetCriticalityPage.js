import React from 'react';
import AIPage from '../components/AIPage';
import { aiAssetCriticality } from '../services/api';

export default function AIAssetCriticalityPage() {
  return (
    <AIPage
      title="AI · Asset Criticality"
      feature="asset-criticality"
      subtitle="Score asset criticality using a Purdue + impact lens."
      inputs={[
        { key: 'asset_text', label: 'Asset (free-form)', type: 'textarea',
          placeholder: 'e.g. PLC-1001 — Siemens S7-1500, Refinery Zone A, L1, feed valves to crude column.' },
      ]}
      run={(v) => aiAssetCriticality({ asset_text: v.asset_text })}
    />
  );
}
