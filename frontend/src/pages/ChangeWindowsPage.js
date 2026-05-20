import React from 'react';
import CrudPage from '../components/CrudPage';
import { changeWindowsApi } from '../services/api';

export default function ChangeWindowsPage() {
  return (
    <CrudPage
      title="Change Windows"
      subtitle="Scheduled Management-of-Change windows and approvers."
      api={changeWindowsApi}
      fields={[
        { key: 'window_id', label: 'Window ID' },
        { key: 'name',      label: 'Name' },
        { key: 'start_at',  label: 'Start',  type: 'datetime-local' },
        { key: 'end_at',    label: 'End',    type: 'datetime-local' },
        { key: 'scope',     label: 'Scope' },
        { key: 'approver',  label: 'Approver' },
      ]}
    />
  );
}
