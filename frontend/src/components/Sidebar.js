import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const ASSET_LINKS = [
  { to: '/ot-assets',          label: 'OT Assets' },
  { to: '/plcs',               label: 'PLCs' },
  { to: '/hmis',               label: 'HMIs' },
  { to: '/scada-servers',      label: 'SCADA Servers' },
  { to: '/safety-systems',     label: 'Safety Systems (SIS)' },
  { to: '/control-loops',      label: 'Control Loops' },
];

const SECOPS_LINKS = [
  { to: '/ics-alerts',         label: 'ICS Alerts' },
  { to: '/ics-incidents',      label: 'ICS Incidents' },
  { to: '/ics-runbooks',       label: 'ICS Runbooks' },
  { to: '/ics-iocs',           label: 'ICS IOCs' },
  { to: '/operator-actions',   label: 'Operator Actions' },
  { to: '/audit-log',          label: 'Audit Log' },
];

const NETWORK_LINKS = [
  { to: '/network-zones',       label: 'Network Zones (Purdue)' },
  { to: '/protocol-anomalies',  label: 'Protocol Anomalies' },
  { to: '/network-baselines',   label: 'Network Baselines' },
  { to: '/firmware-versions',   label: 'Firmware Versions' },
  { to: '/vendor-patches',      label: 'Vendor Patches' },
  { to: '/change-windows',      label: 'Change Windows' },
];

const AI_LINKS = [
  { to: '/ai/triage-ics-alert',         label: 'AI · Triage ICS Alert' },
  { to: '/ai/baseline-protocol',        label: 'AI · Baseline Protocol' },
  { to: '/ai/classify-incident',        label: 'AI · Classify Incident' },
  { to: '/ai/suggest-isolation',        label: 'AI · Suggest Isolation' },
  { to: '/ai/draft-change-procedure',   label: 'AI · Draft Change Procedure' },
  { to: '/ai/vendor-patch-impact',      label: 'AI · Vendor Patch Impact' },
  { to: '/ai/control-loop-anomaly',     label: 'AI · Control Loop Anomaly' },
  { to: '/ai/safety-impact',            label: 'AI · Safety Impact' },
];

const OPERATIONS_LINKS = [
  { to: '/custom-views',       label: 'Custom Views' },
];

const AI_LINKS_V2 = [
  { to: '/ai/executive-brief',          label: 'AI · Executive Brief' },
  { to: '/ai/hunt-attack-path',         label: 'AI · Hunt Attack Path' },
  { to: '/ai/asset-criticality',        label: 'AI · Asset Criticality' },
  { to: '/ai/network-segmentation',     label: 'AI · Network Segmentation' },
  { to: '/ai/malicious-firmware-detect',label: 'AI · Malicious Firmware Detect' },
  { to: '/ai/operator-action-review',   label: 'AI · Operator Action Review' },
  { to: '/ai/mitre-ics-mapper',         label: 'AI · MITRE ATT&CK ICS Mapper' },
  { to: '/ai/supply-chain-firmware',    label: 'AI · Supply-Chain Firmware' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>OT/ICS SECOPS</h1>
        <p>Industrial Security Ops Hub</p>
      </div>

      <NavLink to="/" end>Command Dashboard</NavLink>

      <div className="sidebar-group-label">OT Assets & Control</div>
      {ASSET_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">SecOps & Incident</div>
      {SECOPS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Network & Patching</div>
      {NETWORK_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Operations</div>
      {OPERATIONS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI · Detection & Response</div>
      {AI_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">AI · Strategic</div>
      {AI_LINKS_V2.map((l) => (
        <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
      ))}

      <div className="sidebar-group-label">Admin</div>
      <NavLink to="/webhooks">Webhooks</NavLink>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
