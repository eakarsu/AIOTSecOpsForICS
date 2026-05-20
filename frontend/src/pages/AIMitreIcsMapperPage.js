import React from 'react';
import AIPage from '../components/AIPage';
import { aiMitreIcsMapper } from '../services/api';

export default function AIMitreIcsMapperPage() {
  return (
    <AIPage
      title="AI · MITRE ATT&CK ICS Mapper"
      feature="mitre-ics-mapper"
      subtitle="Map observed activity to MITRE ATT&CK for ICS tactics and techniques."
      inputs={[
        { key: 'observations_text', label: 'Observations (free-form)', type: 'textarea',
          placeholder: 'e.g. Off-hours Modbus 0x10 writes from engineering WS to refinery PLC; bypass of change-window controls.' },
      ]}
      run={(v) => aiMitreIcsMapper({ observations_text: v.observations_text })}
    />
  );
}
