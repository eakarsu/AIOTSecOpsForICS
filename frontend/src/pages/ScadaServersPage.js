import React from 'react';
import CrudPage from '../components/CrudPage';
import { scadaServersApi } from '../services/api';

export default function ScadaServersPage() {
  return (
    <CrudPage
      title="SCADA Servers"
      subtitle="Primary / standby / historian / DMZ proxy / reporting / AD."
      api={scadaServersApi}
      fields={[
        { key: 'server_id',   label: 'Server ID' },
        { key: 'role',        label: 'Role' },
        { key: 'version',     label: 'Version' },
        { key: 'location',    label: 'Location' },
        { key: 'redundancy',  label: 'Redundancy', type: 'select', options: ['single','active-passive','active-active','cluster','replica'] },
        { key: 'last_backup', label: 'Last Backup', type: 'date' },
      ]}
    />
  );
}
