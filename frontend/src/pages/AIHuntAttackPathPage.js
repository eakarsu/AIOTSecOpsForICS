import React from 'react';
import AIPage from '../components/AIPage';
import { aiHuntAttackPath } from '../services/api';

export default function AIHuntAttackPathPage() {
  return (
    <AIPage
      title="AI · Hunt Attack Path"
      feature="hunt-attack-path"
      subtitle="Walk an attacker's likely path through the OT environment for a given hypothesis."
      inputs={[
        { key: 'hypothesis', label: 'Hunt Hypothesis', type: 'textarea',
          placeholder: 'e.g. A compromised engineering WS is staging unauthorized PLC firmware uploads across L2.' },
      ]}
      run={(v) => aiHuntAttackPath({ hypothesis: v.hypothesis })}
    />
  );
}
