import React from 'react';
import CrudPage from '../components/CrudPage';
import { networkZonesApi } from '../services/api';

export default function NetworkZonesPage() {
  return (
    <CrudPage
      title="Network Zones (Purdue)"
      subtitle="Purdue model zones, levels, criticality and gateway."
      api={networkZonesApi}
      statusKey="criticality"
      fields={[
        { key: 'zone_id',      label: 'Zone ID' },
        { key: 'name',         label: 'Name' },
        { key: 'purdue_level', label: 'Purdue Level', type: 'select', options: ['L0','L1','L2','L3','L3.5','L4','L5'] },
        { key: 'criticality',  label: 'Criticality',  type: 'select', options: ['low','medium','high','critical'] },
        { key: 'gateway',      label: 'Gateway' },
        { key: 'asset_count',  label: 'Asset Count',  type: 'number' },
      ]}
    />
  );
}
