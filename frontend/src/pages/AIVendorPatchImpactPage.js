import React from 'react';
import AIPage from '../components/AIPage';
import { aiVendorPatchImpact } from '../services/api';

export default function AIVendorPatchImpactPage() {
  return (
    <AIPage
      title="AI · Vendor Patch Impact"
      feature="vendor-patch-impact"
      subtitle="Assess a vendor advisory against the installed fleet."
      inputs={[
        { key: 'advisory', label: 'Advisory', type: 'textarea',
          placeholder: 'e.g. SSA-714771 — Siemens S7-1500 auth bypass (critical). Affected V2.8.x.' },
      ]}
      run={(v) => aiVendorPatchImpact({ advisory: v.advisory })}
    />
  );
}
