import React, { useState } from 'react';

const controls = [
  ['OT Identity & Access', 'Access', 'SSO/MFA rollout, remote access review, jump host sessions, break-glass access, and access recertification', 'Implemented surface'],
  ['OT Connector Operations', 'Integrations', 'Passive sensors, historian, CMDB, SIEM, EDR, patch feeds, and vendor advisory connector ownership', 'Implemented surface'],
  ['ICS Audit Export Center', 'Governance', 'NERC CIP, IEC 62443, operator actions, change approvals, SIS evidence, and incident exports', 'Implemented surface'],
  ['OT Notification Delivery', 'Response', 'Operator, plant, vendor, security, and executive notifications with retry and acknowledgement tracking', 'Implemented surface'],
  ['Backup & Restore Readiness', 'Resilience', 'PLC, HMI, SCADA, golden image, restore-test evidence, and configuration drift tracking', 'Implemented surface'],
  ['OT Observability & Runbooks', 'Operations', 'Sensor health, protocol parser failures, queue depth, safe-mode runbooks, and incident support ownership', 'Implemented surface'],
  ['OT Release Test Harness', 'Quality', 'Safe test scenarios, browser regression, permission checks, connector smoke tests, and release gates', 'Implemented surface'],
];

export default function ProductionControlsPage() {
  const [selected, setSelected] = useState(controls[0]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>OT/ICS Production Controls</h1>
          <p>Operational controls needed before rollout in industrial environments with safety and availability constraints.</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card"><span>Controls</span><strong>{controls.length}</strong><small>Production workspaces</small></div>
        <div className="metric-card"><span>Critical Path</span><strong>Safety</strong><small>SIS and change controls</small></div>
        <div className="metric-card"><span>Launch Gate</span><strong>Active</strong><small>Safe tests and audit evidence</small></div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>{selected[0]}</h2>
        <p><strong>Domain:</strong> {selected[1]}</p>
        <p>{selected[2]}</p>
        <p><strong>Status:</strong> {selected[3]}</p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Domain</th>
              <th>Production Capability</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((row) => (
              <tr key={row[0]} onClick={() => setSelected(row)} style={{ cursor: 'pointer' }}>
                <td><strong>{row[0]}</strong></td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
                <td>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
