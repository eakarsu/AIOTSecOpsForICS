import React from 'react';
import CrudPage from '../components/CrudPage';
import { networkConduitsApi } from '../services/api';

// Apply pass 7 — Zone editor authoring CRUD (Purdue diagram in /custom-views is read-only).
export default function NetworkConduitsPage() {
  return (
    <CrudPage
      title="Network Conduits (Zone Editor)"
      subtitle="Authoring CRUD for Purdue zone-to-zone conduits (edges). Advisory only — does not push firewall changes."
      api={networkConduitsApi}
      statusKey="posture"
      fields={[
        { key: 'conduit_id',  label: 'Conduit ID' },
        { key: 'src_zone_id', label: 'Source Zone ID' },
        { key: 'dst_zone_id', label: 'Destination Zone ID' },
        { key: 'protocols',   label: 'Protocols (comma-separated)' },
        { key: 'direction',   label: 'Direction',  type: 'select', options: ['in','out','bidirectional'] },
        { key: 'posture',     label: 'Posture',    type: 'select', options: ['allow','inspect','block'] },
        { key: 'notes',       label: 'Notes',      type: 'textarea' },
      ]}
    />
  );
}
