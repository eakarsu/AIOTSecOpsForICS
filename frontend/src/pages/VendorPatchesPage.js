import React from 'react';
import CrudPage from '../components/CrudPage';
import { vendorPatchesApi } from '../services/api';

export default function VendorPatchesPage() {
  return (
    <CrudPage
      title="Vendor Patches"
      subtitle="Vendor advisories: pending, staged, applied."
      api={vendorPatchesApi}
      statusKey="severity"
      fields={[
        { key: 'patch_id',        label: 'Patch ID' },
        { key: 'vendor',          label: 'Vendor' },
        { key: 'advisory',        label: 'Advisory' },
        { key: 'severity',        label: 'Severity',        type: 'select', options: ['low','medium','high','critical'] },
        { key: 'affected_models', label: 'Affected Models' },
        { key: 'status',          label: 'Status',          type: 'select', options: ['pending','staged','applied','rejected'] },
      ]}
    />
  );
}
