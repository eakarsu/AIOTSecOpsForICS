import React from 'react';
import CrudPage from '../components/CrudPage';
import { icsIocsApi } from '../services/api';

export default function IcsIocsPage() {
  return (
    <CrudPage
      title="ICS IOCs"
      subtitle="Indicators of compromise — IPs, hashes, domains, filenames, registry."
      api={icsIocsApi}
      statusKey="confidence"
      fields={[
        { key: 'ioc_id',     label: 'IOC ID' },
        { key: 'type',       label: 'Type',       type: 'select', options: ['ip','domain','hash','filename','registry','user-agent'] },
        { key: 'value',      label: 'Value' },
        { key: 'source',     label: 'Source' },
        { key: 'confidence', label: 'Confidence', type: 'select', options: ['low','medium','high'] },
        { key: 'first_seen', label: 'First Seen', type: 'datetime-local' },
      ]}
    />
  );
}
