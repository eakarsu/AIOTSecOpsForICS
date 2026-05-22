import React from 'react';
import AIPage from '../components/AIPage';
import { aiParseProtocolPayload, getAIV2Samples } from '../services/api';

export default function AIParseProtocolPayloadPage() {
  return (
    <AIPage
      title="AI · Parse Protocol Payload"
      feature="parse-protocol-payload"
      samplesFn={getAIV2Samples}
      subtitle="Deep-parse a caller-supplied Modbus / DNP3 / IEC-61850 / OPC UA / EtherNet/IP payload and surface behavioral diff. Advisory only — no automated mitigation."
      inputs={[
        { key: 'protocol',     label: 'Protocol', type: 'select',
          options: ['Modbus TCP','DNP3','IEC-61850 GOOSE','IEC-61850 SV','OPC UA','EtherNet/IP','Profinet','S7Comm','S7Comm-Plus'] },
        { key: 'payload_text', label: 'Payload (hex / capture / free-form)', type: 'textarea',
          placeholder: 'Paste raw bytes, capture summary or free-form description.' },
      ]}
      run={(v) => aiParseProtocolPayload({ protocol: v.protocol, payload_text: v.payload_text })}
    />
  );
}
