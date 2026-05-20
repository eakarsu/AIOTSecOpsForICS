import React from 'react';
import CrudPage from '../components/CrudPage';
import { otAssetsApi } from '../services/api';

export default function OtAssetsPage() {
  return (
    <CrudPage
      title="OT Assets"
      subtitle="PLCs, HMIs, SCADA servers, RTUs, gateways and engineering workstations."
      api={otAssetsApi}
      statusKey="criticality"
      fields={[
        { key: 'asset_id',    label: 'Asset ID' },
        { key: 'type',        label: 'Type',        type: 'select', options: ['PLC','HMI','SCADA Server','RTU','Engineering WS','Historian','Safety PLC','Field Switch','Gateway','Jump Server'] },
        { key: 'vendor',      label: 'Vendor' },
        { key: 'model',       label: 'Model' },
        { key: 'criticality', label: 'Criticality', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'zone',        label: 'Zone' },
      ]}
    />
  );
}
