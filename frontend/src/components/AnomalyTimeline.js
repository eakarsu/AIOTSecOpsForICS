import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

// Protocol -> color. Anything else falls into "Other".
const PROTOCOL_COLOR = {
  'modbus tcp':   '#3b82f6',
  modbus:         '#3b82f6',
  dnp3:           '#f59e0b',
  'opc ua':       '#8b5cf6',
  opcua:          '#8b5cf6',
  'ethernet/ip':  '#06b6d4',
  profinet:       '#22c55e',
  s7comm:         '#ec4899',
  's7comm-plus':  '#ec4899',
  bacnet:         '#eab308',
  'iec-61850':    '#a78bfa',
  smb:            '#94a3b8',
  http:           '#64748b',
};
function protoColor(p) {
  const k = String(p || '').toLowerCase();
  return PROTOCOL_COLOR[k] || '#94a3b8';
}

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: '#0b1424',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '10px 12px',
        color: '#f1f5f9',
        fontSize: 12,
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.anomaly_id}</div>
      <div style={{ color: '#94a3b8' }}>{p.protocol} · {p.type}</div>
      <div style={{ color: '#cbd5e1', marginTop: 4 }}>
        {p.src_asset} → {p.dst_asset}
      </div>
      <div style={{ color: '#cbd5e1' }}>Deviation: <strong>{p.baseline_deviation}</strong></div>
      <div style={{ color: '#64748b', marginTop: 4 }}>{fmtTime(p.created_at)}</div>
    </div>
  );
}

export default function AnomalyTimeline() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/custom-views/anomaly-timeline`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Group rows by protocol so each protocol is its own Scatter series with own color.
  const series = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.protocol || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return [...map.entries()].map(([protocol, data]) => ({
      protocol,
      color: protoColor(protocol),
      data,
    }));
  }, [rows]);

  const xDomain = useMemo(() => {
    if (!rows.length) return ['auto', 'auto'];
    const ts = rows.map((r) => r.ts || (r.created_at ? new Date(r.created_at).getTime() : 0)).filter(Boolean);
    if (!ts.length) return ['auto', 'auto'];
    return [Math.min(...ts), Math.max(...ts)];
  }, [rows]);

  if (loading) return <div className="empty-state">Loading anomaly timeline...</div>;
  if (err)     return <div className="ai-error">Failed to load anomaly timeline: {err}</div>;
  if (!rows.length) return <div className="empty-state">No anomalies recorded yet.</div>;

  return (
    <div
      style={{
        background: '#0b1424',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="ts"
              name="Time"
              domain={xDomain}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              }}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="baseline_deviation"
              name="Baseline Deviation"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Baseline Deviation', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
            <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
            {series.map((s) => (
              <Scatter key={s.protocol} name={s.protocol} data={s.data} fill={s.color} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
