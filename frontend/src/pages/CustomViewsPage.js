import React from 'react';
import PurdueDiagram from '../components/PurdueDiagram';
import AnomalyTimeline from '../components/AnomalyTimeline';

export default function CustomViewsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Custom Views</h2>
          <p>Purdue model network topology and live protocol-anomaly timeline.</p>
        </div>
      </div>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ color: '#f1f5f9', margin: '8px 0 12px', fontSize: 16 }}>
          Purdue Model — OT Asset Topology
        </h3>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 0, marginBottom: 12 }}>
          OT assets grouped by Purdue level (0 Field → 4 Enterprise), colored by criticality.
          Hover or click any node for asset details.
        </p>
        <PurdueDiagram />
      </section>

      <section>
        <h3 style={{ color: '#f1f5f9', margin: '8px 0 12px', fontSize: 16 }}>
          Protocol Anomaly Timeline
        </h3>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 0, marginBottom: 12 }}>
          Last 100 protocol anomalies plotted by detection time vs. baseline deviation.
          Each point is colored by industrial protocol family.
        </p>
        <AnomalyTimeline />
      </section>
    </div>
  );
}
