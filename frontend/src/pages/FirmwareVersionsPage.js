import React from 'react';
import CrudPage from '../components/CrudPage';
import { firmwareVersionsApi } from '../services/api';

export default function FirmwareVersionsPage() {
  return (
    <CrudPage
      title="Firmware Versions"
      subtitle="Vendor / model / version inventory and CVE counts."
      api={firmwareVersionsApi}
      fields={[
        { key: 'firmware_id', label: 'Firmware ID' },
        { key: 'vendor',      label: 'Vendor' },
        { key: 'model',       label: 'Model' },
        { key: 'version',     label: 'Version' },
        { key: 'cve_count',   label: 'CVE Count', type: 'number' },
        { key: 'latest',      label: 'Latest',    type: 'select', options: ['true','false'] },
      ]}
    />
  );
}
