import React from 'react';
import AIPage from '../components/AIPage';
import { aiBaselineProtocol } from '../services/api';

export default function AIBaselineProtocolPage() {
  return (
    <AIPage
      title="AI · Baseline Protocol"
      feature="baseline-protocol"
      subtitle="Build a normal-traffic baseline for a given OT protocol in a zone."
      inputs={[
        { key: 'zone',         label: 'Zone',         placeholder: 'e.g. Refinery Cell A' },
        { key: 'protocol',     label: 'Protocol',     type: 'select', options: ['Modbus TCP','DNP3','OPC UA','EtherNet/IP','Profinet','IEC-61850','S7Comm','S7Comm-Plus','BACnet'] },
        { key: 'observation',  label: 'Observation Notes', type: 'textarea',
          placeholder: 'Recent observed flows, sampling window, source assets etc.' },
      ]}
      run={(v) => aiBaselineProtocol({ zone: v.zone, protocol: v.protocol, observation: { notes: v.observation } })}
    />
  );
}
