import React from 'react';
import CrudPage from '../components/CrudPage';
import { safetySystemsApi } from '../services/api';

export default function SafetySystemsPage() {
  return (
    <CrudPage
      title="Safety Systems (SIS)"
      subtitle="SIS / ESD / HIPPS / BMS / FGS — SIL rating and last proof test."
      api={safetySystemsApi}
      statusKey="status"
      fields={[
        { key: 'sis_id',    label: 'SIS ID' },
        { key: 'name',      label: 'Name' },
        { key: 'type',      label: 'Type',      type: 'select', options: ['ESD','SIS','HIPPS','BMS','FGS','PSP','ESS'] },
        { key: 'sil_level', label: 'SIL Level', type: 'select', options: ['SIL1','SIL2','SIL3','SIL4'] },
        { key: 'last_test', label: 'Last Test', type: 'date' },
        { key: 'status',    label: 'Status',    type: 'select', options: ['healthy','degraded','bypassed','offline'] },
      ]}
    />
  );
}
