import React from 'react';
import CrudPage from '../components/CrudPage';
import { networkBaselinesApi } from '../services/api';

export default function NetworkBaselinesPage() {
  return (
    <CrudPage
      title="Network Baselines"
      subtitle="Learned protocol baselines per zone and current drift posture."
      api={networkBaselinesApi}
      statusKey="status"
      fields={[
        { key: 'baseline_id', label: 'Baseline ID' },
        { key: 'zone',        label: 'Zone' },
        { key: 'protocol',    label: 'Protocol' },
        { key: 'learned_at',  label: 'Learned At', type: 'datetime-local' },
        { key: 'drift_pct',   label: 'Drift (%)',  type: 'number' },
        { key: 'status',      label: 'Status',     type: 'select', options: ['stable','drifting','breach'] },
      ]}
    />
  );
}
