import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

const CRIT_COLOR = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#ca8a04',
  low:      '#16a34a',
};
function critColor(c) {
  const k = String(c || '').toLowerCase();
  return CRIT_COLOR[k] || '#64748b';
}

// Layout constants
const W = 1100;
const LAYER_H = 110;
const PAD_X = 20;
const LABEL_W = 200;
const NODE_R = 18;
const NODE_GAP = 6;

export default function PurdueDiagram() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [hover, setHover] = useState(null); // { asset, x, y }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/custom-views/purdue-network`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!cancelled) setLayers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="empty-state">Loading Purdue model...</div>;
  if (err)     return <div className="ai-error">Failed to load Purdue diagram: {err}</div>;
  if (!layers.length) return <div className="empty-state">No layer data.</div>;

  const H = layers.length * LAYER_H + 40;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        className="purdue-diagram"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', background: '#0b1424', borderRadius: 10, border: '1px solid #1e293b' }}
      >
        {/* Layer rows (top = Enterprise / level 4, bottom = Field / level 0) */}
        {[...layers].reverse().map((layer, idx) => {
          const y = 20 + idx * LAYER_H;
          const stripeFill = idx % 2 === 0 ? '#111c30' : '#0d172a';
          // assets row inside the layer
          const innerY = y + LAYER_H / 2;
          const available = W - LABEL_W - PAD_X * 2;
          const perRow = Math.max(1, Math.floor(available / (NODE_R * 2 + NODE_GAP)));
          return (
            <g key={layer.level}>
              <rect x={0} y={y} width={W} height={LAYER_H} fill={stripeFill} />
              <text x={PAD_X} y={y + 24} fill="#f1f5f9" fontSize="14" fontWeight="700">
                Level {layer.level}: {layer.name}
              </text>
              <text x={PAD_X} y={y + 44} fill="#94a3b8" fontSize="11">
                {layer.description}
              </text>
              <text x={PAD_X} y={y + 64} fill="#64748b" fontSize="11">
                {layer.assets.length} asset{layer.assets.length === 1 ? '' : 's'}
              </text>

              {/* divider line between label column and node column */}
              <line
                x1={LABEL_W}
                y1={y + 8}
                x2={LABEL_W}
                y2={y + LAYER_H - 8}
                stroke="#1e293b"
                strokeWidth="1"
              />

              {/* nodes */}
              {layer.assets.map((a, i) => {
                const col = i % perRow;
                const row = Math.floor(i / perRow);
                const cx = LABEL_W + PAD_X + NODE_R + col * (NODE_R * 2 + NODE_GAP);
                const cy = innerY - 20 + row * (NODE_R * 2 + NODE_GAP);
                if (cy > y + LAYER_H - NODE_R) return null;
                const fill = critColor(a.criticality);
                return (
                  <g
                    key={a.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHover({ asset: a, x: cx, y: cy })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setHover({ asset: a, x: cx, y: cy })}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={NODE_R - 2}
                      fill={fill}
                      stroke="#0b1424"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={cy + 3}
                      fontSize="8"
                      fill="#fff"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {String(a.type || '').slice(0, 4)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
        {Object.entries(CRIT_COLOR).map(([k, v]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: v, borderRadius: 3, display: 'inline-block' }} />
            {k}
          </span>
        ))}
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div
          style={{
            position: 'absolute',
            left: `${(hover.x / W) * 100}%`,
            top: hover.y + 30,
            transform: 'translateX(-50%)',
            background: '#0b1424',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#f1f5f9',
            fontSize: 12,
            minWidth: 220,
            pointerEvents: 'none',
            zIndex: 5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{hover.asset.asset_id}</div>
          <div style={{ color: '#94a3b8' }}>{hover.asset.type} · {hover.asset.vendor}</div>
          <div style={{ color: '#cbd5e1', marginTop: 4 }}>Model: {hover.asset.model || '—'}</div>
          <div style={{ color: '#cbd5e1' }}>Zone: {hover.asset.zone || '—'}</div>
          <div style={{ marginTop: 4 }}>
            <span
              style={{
                background: critColor(hover.asset.criticality),
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {hover.asset.criticality || 'unknown'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
