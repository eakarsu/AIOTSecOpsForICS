import React from 'react';
import AIPage from '../components/AIPage';
import { aiDraftChangeProcedure } from '../services/api';

export default function AIDraftChangeProcedurePage() {
  return (
    <AIPage
      title="AI · Draft Change Procedure"
      feature="draft-change-procedure"
      subtitle="Draft a Management-of-Change procedure with steps, approvals and rollback."
      inputs={[
        { key: 'scope',       label: 'Change Scope', type: 'textarea',
          placeholder: 'e.g. Patch Siemens S7-1500 PLC-1001 firmware V2.8.1 → V2.9.2.' },
        { key: 'constraints', label: 'Constraints', type: 'textarea',
          placeholder: 'Window, redundancy available, who must approve, rollback budget.' },
      ]}
      run={(v) => aiDraftChangeProcedure({ scope: v.scope, constraints: v.constraints })}
    />
  );
}
