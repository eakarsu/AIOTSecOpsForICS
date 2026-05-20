import React from 'react';
import CrudPage from '../components/CrudPage';
import { controlLoopsApi } from '../services/api';

export default function ControlLoopsPage() {
  return (
    <CrudPage
      title="Control Loops"
      subtitle="PV/SP tags and loop status across plant areas."
      api={controlLoopsApi}
      statusKey="status"
      fields={[
        { key: 'loop_id', label: 'Loop ID' },
        { key: 'name',    label: 'Name' },
        { key: 'asset',   label: 'Asset (PLC)' },
        { key: 'pv_tag',  label: 'PV Tag' },
        { key: 'sp_tag',  label: 'SP Tag' },
        { key: 'status',  label: 'Status', type: 'select', options: ['normal','oscillating','frozen','saturated','manual','suspicious','drifting'] },
      ]}
    />
  );
}
