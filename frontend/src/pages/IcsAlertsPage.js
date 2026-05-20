import React from 'react';
import CrudPage from '../components/CrudPage';
import { icsAlertsApi } from '../services/api';

export default function IcsAlertsPage() {
  return (
    <CrudPage
      title="ICS Alerts"
      subtitle="Alerts from Claroty CTD, Dragos, Nozomi Guardian, Tenable.ot, Splunk SIEM."
      api={icsAlertsApi}
      statusKey="severity"
      fields={[
        { key: 'alert_id',  label: 'Alert ID' },
        { key: 'source',    label: 'Source',   type: 'select', options: ['Claroty CTD','Dragos','Nozomi Guardian','Tenable.ot','Splunk SIEM'] },
        { key: 'severity',  label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'asset_id',  label: 'Asset ID' },
        { key: 'signature', label: 'Signature' },
        { key: 'status',    label: 'Status',   type: 'select', options: ['open','triaging','investigating','closed'] },
      ]}
    />
  );
}
