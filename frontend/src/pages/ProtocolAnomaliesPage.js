import React from 'react';
import CrudPage from '../components/CrudPage';
import { protocolAnomaliesApi } from '../services/api';

export default function ProtocolAnomaliesPage() {
  return (
    <CrudPage
      title="Protocol Anomalies"
      subtitle="Modbus, DNP3, OPC UA, Profinet, IEC-61850, EtherNet/IP deviations."
      api={protocolAnomaliesApi}
      fields={[
        { key: 'anomaly_id',         label: 'Anomaly ID' },
        { key: 'protocol',           label: 'Protocol',           type: 'select', options: ['Modbus TCP','DNP3','OPC UA','EtherNet/IP','Profinet','IEC-61850','S7Comm','S7Comm-Plus','BACnet','SMB','HTTP','EtherCAT'] },
        { key: 'src_asset',          label: 'Src Asset' },
        { key: 'dst_asset',          label: 'Dst Asset' },
        { key: 'type',               label: 'Type' },
        { key: 'baseline_deviation', label: 'Baseline Dev (%)', type: 'number' },
      ]}
    />
  );
}
