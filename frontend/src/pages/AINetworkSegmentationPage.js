import React from 'react';
import AIPage from '../components/AIPage';
import { aiNetworkSegmentation } from '../services/api';

export default function AINetworkSegmentationPage() {
  return (
    <AIPage
      title="AI · Network Segmentation"
      feature="network-segmentation"
      subtitle="Recommend segmentation improvements across Purdue levels."
      inputs={[
        { key: 'focus', label: 'Focus / Constraints', type: 'textarea',
          placeholder: 'Optional — narrow to a subset of zones or a posture concern.' },
      ]}
      run={(v) => aiNetworkSegmentation({ focus: v.focus })}
      buttonLabel="Analyze Segmentation"
    />
  );
}
