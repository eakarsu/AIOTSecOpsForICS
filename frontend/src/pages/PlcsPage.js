import React from 'react';
import CrudPage from '../components/CrudPage';
import { plcsApi } from '../services/api';

export default function PlcsPage() {
  return (
    <CrudPage
      title="PLCs"
      subtitle="Programmable Logic Controllers — vendor, firmware, status."
      api={plcsApi}
      statusKey="status"
      fields={[
        { key: 'plc_id',     label: 'PLC ID' },
        { key: 'vendor',     label: 'Vendor' },
        { key: 'firmware',   label: 'Firmware' },
        { key: 'location',   label: 'Location' },
        { key: 'status',     label: 'Status',     type: 'select', options: ['online','offline','degraded','maintenance'] },
        { key: 'last_patch', label: 'Last Patch', type: 'date' },
      ]}
    />
  );
}
