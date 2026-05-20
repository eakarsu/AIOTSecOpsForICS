import React from 'react';
import CrudPage from '../components/CrudPage';
import { icsRunbooksApi } from '../services/api';

export default function IcsRunbooksPage() {
  return (
    <CrudPage
      title="ICS Runbooks"
      subtitle="Containment / Eradication / Recovery / Hunt playbooks."
      api={icsRunbooksApi}
      statusKey="category"
      fields={[
        { key: 'runbook_id', label: 'Runbook ID' },
        { key: 'name',       label: 'Name' },
        { key: 'category',   label: 'Category', type: 'select', options: ['Triage','Containment','Eradication','Recovery','Hunt','Patching','Safety','Compliance'] },
        { key: 'scenario',   label: 'Scenario' },
        { key: 'version',    label: 'Version' },
        { key: 'owner',      label: 'Owner' },
      ]}
    />
  );
}
