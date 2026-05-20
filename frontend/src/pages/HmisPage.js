import React from 'react';
import CrudPage from '../components/CrudPage';
import { hmisApi } from '../services/api';

export default function HmisPage() {
  return (
    <CrudPage
      title="HMIs"
      subtitle="Operator workstations / human-machine interfaces."
      api={hmisApi}
      statusKey="status"
      fields={[
        { key: 'hmi_id',           label: 'HMI ID' },
        { key: 'plant',            label: 'Plant' },
        { key: 'operating_system', label: 'Operating System' },
        { key: 'version',          label: 'Version' },
        { key: 'status',           label: 'Status', type: 'select', options: ['online','offline','maintenance','patching','eol'] },
        { key: 'owner',            label: 'Owner' },
      ]}
    />
  );
}
