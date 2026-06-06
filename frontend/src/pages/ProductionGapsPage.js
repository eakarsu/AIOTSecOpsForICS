import React, { useState } from 'react';

const rows = [
  ['Passive Asset Discovery', 'Asset Inventory', 'Non-invasive OT asset discovery, owner mapping, firmware, and criticality confidence', 'Implemented surface'],
  ['Purdue Zone Enforcement', 'Network', 'Zone/conduit rule review, segmentation drift, exceptions, and approval history', 'Implemented surface'],
  ['Protocol Deep Inspection', 'Detection', 'Modbus, DNP3, OPC UA, EtherNet/IP parsing and anomaly explanation', 'Implemented surface'],
  ['SIS Safety Impact Review', 'Safety', 'Safety instrumented system impact, trip risk, and operator approval workflow', 'Implemented surface'],
  ['Change Window Governance', 'Operations', 'Maintenance window approval, rollback plan, operator signoff, and audit trail', 'Implemented surface'],
  ['Vendor Patch Intake', 'Patching', 'Advisory ingestion, exploitability, downtime risk, and staged deployment plan', 'Implemented surface'],
  ['Firmware Integrity Checks', 'Patching', 'Firmware hash validation, source trust, downgrade risk, and device compatibility', 'Implemented surface'],
  ['Remote Access Session Review', 'Access', 'Vendor access, jump host sessions, command review, and break-glass evidence', 'Implemented surface'],
  ['Operator Action Analytics', 'Operations', 'Unusual operator commands, procedure variance, shift notes, and safety confirmation', 'Implemented surface'],
  ['OT Incident Timeline', 'Incident Response', 'Alert to containment timeline with plant impact, evidence, and recovery milestones', 'Implemented surface'],
  ['Backup and Restore Readiness', 'Resilience', 'PLC/HMI/SCADA backups, restore tests, golden images, and drift alerts', 'Implemented surface'],
  ['Crown Jewel Mapping', 'Risk', 'Critical process mapping, business impact, dependencies, and compensating controls', 'Implemented surface'],
  ['IT/OT Lateral Movement', 'Threat Hunting', 'Jump paths, dual-homed assets, credential paths, and containment candidates', 'Implemented surface'],
  ['Compliance Evidence Pack', 'Governance', 'NERC CIP, IEC 62443, audit evidence, exceptions, and remediation owners', 'Implemented surface'],
  ['OT Production Hardening', 'Platform', 'SSO/MFA, audit logs, backups, runbooks, safe testing, and regression checks', 'Implemented surface'],
];

export default function ProductionGapsPage() {
  const [selected, setSelected] = useState(rows[0]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>OT/ICS Production Gaps</h1>
          <p>Industrial security capabilities now organized as implemented production-control records.</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card"><span>Seeded Gaps</span><strong>{rows.length}</strong><small>Production records</small></div>
        <div className="metric-card"><span>Highest Risk</span><strong>SIS</strong><small>Safety impact workflow</small></div>
        <div className="metric-card"><span>Readiness</span><strong>Implemented</strong><small>Controls need live OT connectors</small></div>
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
            {rows.map((row) => (
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
