import React from 'react';
import AIPage from '../components/AIPage';
import { aiLateralMovementNarrative, getAIV2Samples } from '../services/api';

export default function AILateralMovementNarrativePage() {
  return (
    <AIPage
      title="AI · IT/OT Lateral-Movement Narrator"
      feature="lateral-movement-narrative"
      samplesFn={getAIV2Samples}
      subtitle="Compose a cross-domain kill-chain narrative joining IT IOCs, ICS IOCs and Purdue zone crossings. Advisory only."
      inputs={[
        { key: 'it_iocs_text',         label: 'IT IOCs',         type: 'textarea',
          placeholder: 'Phishing, malware hashes, C2 beacons, lateral SMB, etc.' },
        { key: 'ics_iocs_text',        label: 'ICS IOCs',        type: 'textarea',
          placeholder: 'PLC writes, firmware uploads, protocol anomalies.' },
        { key: 'zone_crossings_text',  label: 'Zone Crossings',  type: 'textarea',
          placeholder: 'Corp → DMZ → Engineering → Refinery Cell A; sequence of Purdue zone transitions.' },
      ]}
      run={(v) => aiLateralMovementNarrative({
        it_iocs_text: v.it_iocs_text,
        ics_iocs_text: v.ics_iocs_text,
        zone_crossings_text: v.zone_crossings_text,
      })}
    />
  );
}
