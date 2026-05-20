import React from 'react';
import AIPage from '../components/AIPage';
import { aiSupplyChainFirmware } from '../services/api';

export default function AISupplyChainFirmwarePage() {
  return (
    <AIPage
      title="AI · Supply-Chain Firmware"
      feature="supply-chain-firmware"
      subtitle="Vendor / firmware supply-chain risk picture across the installed OT fleet."
      inputs={[
        { key: 'focus', label: 'Focus / Constraints', type: 'textarea',
          placeholder: 'Optional — narrow to a vendor or recently-onboarded suppliers.' },
      ]}
      run={(v) => aiSupplyChainFirmware({ focus: v.focus })}
      buttonLabel="Assess Supply Chain"
    />
  );
}
