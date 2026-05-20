import React from 'react';
import AIPage from '../components/AIPage';
import { aiMaliciousFirmwareDetect } from '../services/api';

export default function AIMaliciousFirmwareDetectPage() {
  return (
    <AIPage
      title="AI · Malicious Firmware Detect"
      feature="malicious-firmware-detect"
      subtitle="Assess a firmware sample for tampering signs (signature, size, layout)."
      inputs={[
        { key: 'sample_text', label: 'Firmware Sample (free-form)', type: 'textarea',
          placeholder: 'e.g. S7-1500 V2.9.2 image, 8.2 MB, signature missing, uploaded from 10.10.35.42.' },
      ]}
      run={(v) => aiMaliciousFirmwareDetect({ sample_text: v.sample_text })}
    />
  );
}
