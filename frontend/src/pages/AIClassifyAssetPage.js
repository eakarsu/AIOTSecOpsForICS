import React from 'react';
import AIPage from '../components/AIPage';
import { aiClassifyAsset, getAIV2Samples } from '../services/api';

export default function AIClassifyAssetPage() {
  return (
    <AIPage
      title="AI · Asset Auto-Classifier"
      feature="classify-asset"
      samplesFn={getAIV2Samples}
      subtitle="Infer vendor / model / role / Purdue level from passive fingerprint metadata. Advisory only."
      inputs={[
        { key: 'fingerprint_text', label: 'Fingerprint (MAC OUI, ports, banners, hostname, protocols)', type: 'textarea',
          placeholder: 'e.g. MAC OUI 00:1B:1B (Siemens), open 102, banner SIMATIC S7-1500, hostname PLC-REF-A01' },
      ]}
      run={(v) => aiClassifyAsset({ fingerprint_text: v.fingerprint_text })}
    />
  );
}
