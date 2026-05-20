import React from 'react';
import CrudPage from '../components/CrudPage';
import { operatorActionsApi } from '../services/api';

export default function OperatorActionsPage() {
  return (
    <CrudPage
      title="Operator Actions"
      subtitle="Overrides, setpoint changes, bypasses — with justification."
      api={operatorActionsApi}
      fields={[
        { key: 'action_id',     label: 'Action ID' },
        { key: 'operator',      label: 'Operator' },
        { key: 'asset',         label: 'Asset' },
        { key: 'action',        label: 'Action' },
        { key: 'ts',            label: 'Timestamp',   type: 'datetime-local' },
        { key: 'justification', label: 'Justification', type: 'textarea' },
      ]}
    />
  );
}
