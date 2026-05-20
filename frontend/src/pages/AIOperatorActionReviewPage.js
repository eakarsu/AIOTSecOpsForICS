import React from 'react';
import AIPage from '../components/AIPage';
import { aiOperatorActionReview } from '../services/api';

export default function AIOperatorActionReviewPage() {
  return (
    <AIPage
      title="AI · Operator Action Review"
      feature="operator-action-review"
      subtitle="Review the most recent operator actions for out-of-policy or suspicious behavior."
      inputs={[]}
      run={() => aiOperatorActionReview({})}
      buttonLabel="Review Recent Actions"
    />
  );
}
