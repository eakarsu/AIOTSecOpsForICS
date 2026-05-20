import React from 'react';
import CrudPage from '../components/CrudPage';
import { icsIncidentsApi } from '../services/api';

export default function IcsIncidentsPage() {
  return (
    <CrudPage
      title="ICS Incidents"
      subtitle="Open, investigating, contained and closed incidents."
      api={icsIncidentsApi}
      statusKey="severity"
      fields={[
        { key: 'incident_id', label: 'Incident ID' },
        { key: 'title',       label: 'Title' },
        { key: 'status',      label: 'Status',   type: 'select', options: ['open','investigating','contained','eradicating','closed'] },
        { key: 'severity',    label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'opened_at',   label: 'Opened At', type: 'datetime-local' },
        { key: 'owner',       label: 'Owner' },
      ]}
    />
  );
}
