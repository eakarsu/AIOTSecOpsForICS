import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/ot-assets',          title: 'OT Assets',           icon: 'A', color: '#3b82f6', desc: 'PLCs, HMIs, SCADA, RTUs, gateways and engineering WS across plants.' },
  { path: '/plcs',               title: 'PLCs',                icon: 'P', color: '#06b6d4', desc: 'Programmable Logic Controllers, vendor, firmware and patch level.' },
  { path: '/hmis',               title: 'HMIs',                icon: 'H', color: '#10b981', desc: 'Operator workstations, OS, version and ownership.' },
  { path: '/scada-servers',      title: 'SCADA Servers',       icon: 'S', color: '#0ea5e9', desc: 'Primary, standby, historian, alarm and DMZ proxy servers.' },
  { path: '/safety-systems',     title: 'Safety Systems',      icon: 'X', color: '#ef4444', desc: 'SIS / ESD / HIPPS / BMS — SIL ratings and last proof test.' },
  { path: '/control-loops',      title: 'Control Loops',       icon: 'L', color: '#a78bfa', desc: 'PV/SP tags and loop status across plant areas.' },

  { path: '/ics-alerts',         title: 'ICS Alerts',          icon: '!', color: '#dc2626', desc: 'Alerts from Claroty, Dragos, Nozomi, Tenable.ot, Splunk.' },
  { path: '/ics-incidents',      title: 'ICS Incidents',       icon: 'I', color: '#fb7185', desc: 'Open, investigating, contained and closed incidents.' },
  { path: '/ics-runbooks',       title: 'ICS Runbooks',        icon: 'R', color: '#f59e0b', desc: 'Containment, eradication, recovery and hunt playbooks.' },
  { path: '/ics-iocs',           title: 'ICS IOCs',            icon: '*', color: '#ec4899', desc: 'IPs, hashes, domains and registry artifacts.' },
  { path: '/operator-actions',   title: 'Operator Actions',    icon: 'O', color: '#22c55e', desc: 'Operator overrides, setpoint changes, bypasses with justification.' },
  { path: '/audit-log',          title: 'Audit Log',           icon: '#', color: '#94a3b8', desc: 'Actor / target / action / result trail.' },

  { path: '/network-zones',      title: 'Network Zones',       icon: 'Z', color: '#60a5fa', desc: 'Purdue model zones and gateway responsibilities.' },
  { path: '/protocol-anomalies', title: 'Protocol Anomalies',  icon: '~', color: '#facc15', desc: 'Modbus, DNP3, OPC UA, Profinet, IEC-61850 deviations.' },
  { path: '/network-baselines',  title: 'Network Baselines',   icon: 'B', color: '#7dd3fc', desc: 'Learned traffic baselines and drift posture.' },
  { path: '/firmware-versions',  title: 'Firmware Versions',   icon: 'F', color: '#a3e635', desc: 'Vendor / model / version inventory + CVE counts.' },
  { path: '/vendor-patches',     title: 'Vendor Patches',      icon: 'V', color: '#14b8a6', desc: 'Vendor advisories: pending, staged, applied.' },
  { path: '/change-windows',     title: 'Change Windows',      icon: 'W', color: '#f472b6', desc: 'Scheduled MoC windows and approvers.' },

  { path: '/ai/triage-ics-alert',         title: 'AI · Triage ICS Alert',          icon: '*', color: '#8b5cf6', desc: 'Triage a single ICS alert with rationale + actions.' },
  { path: '/ai/baseline-protocol',        title: 'AI · Baseline Protocol',         icon: '*', color: '#8b5cf6', desc: 'Build a normal-traffic baseline for an OT protocol.' },
  { path: '/ai/classify-incident',        title: 'AI · Classify Incident',         icon: '*', color: '#8b5cf6', desc: 'Classify an ICS incident + recommend a runbook.' },
  { path: '/ai/suggest-isolation',        title: 'AI · Suggest Isolation',         icon: '*', color: '#8b5cf6', desc: 'Containment options weighed against process impact.' },
  { path: '/ai/draft-change-procedure',   title: 'AI · Draft Change Procedure',    icon: '*', color: '#8b5cf6', desc: 'Draft a Management-of-Change procedure.' },
  { path: '/ai/vendor-patch-impact',      title: 'AI · Vendor Patch Impact',       icon: '*', color: '#8b5cf6', desc: 'Assess a vendor advisory against the installed fleet.' },
  { path: '/ai/control-loop-anomaly',     title: 'AI · Control Loop Anomaly',      icon: '*', color: '#8b5cf6', desc: 'Diagnose loop oscillation / freeze / saturation.' },
  { path: '/ai/safety-impact',            title: 'AI · Safety Impact',             icon: '*', color: '#8b5cf6', desc: 'Process-safety impact of a cyber event.' },

  { path: '/ai/executive-brief',          title: 'AI · Executive Brief',           icon: '*', color: '#8b5cf6', desc: 'CISO-level OT/ICS security brief snapshot.' },
  { path: '/ai/hunt-attack-path',         title: 'AI · Hunt Attack Path',          icon: '*', color: '#8b5cf6', desc: 'Walk an attacker path given a hypothesis.' },
  { path: '/ai/asset-criticality',        title: 'AI · Asset Criticality',         icon: '*', color: '#8b5cf6', desc: 'Score asset criticality using a Purdue + impact lens.' },
  { path: '/ai/network-segmentation',     title: 'AI · Network Segmentation',      icon: '*', color: '#8b5cf6', desc: 'Recommend segmentation improvements.' },
  { path: '/ai/malicious-firmware-detect',title: 'AI · Malicious Firmware Detect', icon: '*', color: '#8b5cf6', desc: 'Assess a firmware sample for tampering.' },
  { path: '/ai/operator-action-review',   title: 'AI · Operator Action Review',    icon: '*', color: '#8b5cf6', desc: 'Review operator actions for out-of-policy behavior.' },
  { path: '/ai/mitre-ics-mapper',         title: 'AI · MITRE ATT&CK ICS Mapper',   icon: '*', color: '#8b5cf6', desc: 'Map observed activity to ATT&CK for ICS.' },
  { path: '/ai/supply-chain-firmware',    title: 'AI · Supply-Chain Firmware',     icon: '*', color: '#8b5cf6', desc: 'Vendor / firmware supply-chain risk picture.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Command Dashboard</h2>
        <p>Unified OT/ICS security picture · {new Date().toUTCString()}</p>
      </div>

      {err && <div className="ai-error">Stats unavailable: {err}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Open ICS Alerts</div><div className="stat-value">{stats.ics_alerts?.open ?? '—'}</div><div className="stat-sub">{stats.ics_alerts?.critical ?? 0} critical · {stats.ics_alerts?.total ?? 0} total</div></div>
          <div className="stat"><div className="stat-label">Active Incidents</div><div className="stat-value">{stats.ics_incidents?.active ?? '—'}</div><div className="stat-sub">{stats.ics_incidents?.critical ?? 0} critical · {stats.ics_incidents?.total ?? 0} total</div></div>
          <div className="stat"><div className="stat-label">Critical Assets</div><div className="stat-value">{stats.ot_assets?.critical ?? '—'}</div><div className="stat-sub">{stats.ot_assets?.total ?? 0} OT assets</div></div>
          <div className="stat"><div className="stat-label">Pending Patches</div><div className="stat-value">{stats.vendor_patches?.pending ?? '—'}</div><div className="stat-sub">{stats.vendor_patches?.critical ?? 0} critical · {stats.vendor_patches?.total ?? 0} total</div></div>

          <div className="stat"><div className="stat-label">PLCs</div><div className="stat-value">{stats.plcs?.total ?? '—'}</div><div className="stat-sub">{stats.plcs?.online ?? 0} online · {stats.plcs?.degraded ?? 0} degraded</div></div>
          <div className="stat"><div className="stat-label">HMIs</div><div className="stat-value">{stats.hmis?.total ?? '—'}</div><div className="stat-sub">{stats.hmis?.online ?? 0} online · {stats.hmis?.eol ?? 0} EOL</div></div>
          <div className="stat"><div className="stat-label">SCADA Servers</div><div className="stat-value">{stats.scada_servers?.total ?? '—'}</div><div className="stat-sub">primary / standby / historian</div></div>
          <div className="stat"><div className="stat-label">Safety Systems</div><div className="stat-value">{stats.safety_systems?.total ?? '—'}</div><div className="stat-sub">{stats.safety_systems?.healthy ?? 0} healthy · {stats.safety_systems?.bypassed ?? 0} bypassed</div></div>

          <div className="stat"><div className="stat-label">Network Zones</div><div className="stat-value">{stats.network_zones?.total ?? '—'}</div><div className="stat-sub">Purdue model</div></div>
          <div className="stat"><div className="stat-label">Anomalies</div><div className="stat-value">{stats.protocol_anomalies?.total ?? '—'}</div><div className="stat-sub">protocol deviations</div></div>
          <div className="stat"><div className="stat-label">Baselines</div><div className="stat-value">{stats.network_baselines?.total ?? '—'}</div><div className="stat-sub">{stats.network_baselines?.breach ?? 0} in breach</div></div>
          <div className="stat"><div className="stat-label">Firmware</div><div className="stat-value">{stats.firmware_versions?.total ?? '—'}</div><div className="stat-sub">{stats.firmware_versions?.latest ?? 0} latest</div></div>

          <div className="stat"><div className="stat-label">Change Windows</div><div className="stat-value">{stats.change_windows?.total ?? '—'}</div><div className="stat-sub">scheduled MoC</div></div>
          <div className="stat"><div className="stat-label">Control Loops</div><div className="stat-value">{stats.control_loops?.total ?? '—'}</div><div className="stat-sub">{stats.control_loops?.oscillating ?? 0} oscillating</div></div>
          <div className="stat"><div className="stat-label">Operator Actions</div><div className="stat-value">{stats.operator_actions?.total ?? '—'}</div><div className="stat-sub">override + bypass trail</div></div>
          <div className="stat"><div className="stat-label">Runbooks</div><div className="stat-value">{stats.ics_runbooks?.total ?? '—'}</div><div className="stat-sub">playbooks library</div></div>
          <div className="stat"><div className="stat-label">IOCs</div><div className="stat-value">{stats.ics_iocs?.total ?? '—'}</div><div className="stat-sub">threat intel</div></div>
          <div className="stat"><div className="stat-label">Audit Log</div><div className="stat-value">{stats.audit_log?.total ?? '—'}</div><div className="stat-sub">recent entries</div></div>
        </div>
      )}

      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ ['--card-color']: f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
