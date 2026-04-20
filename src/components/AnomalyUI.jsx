import React from 'react';
import { Brain } from 'lucide-react';

export const AnomalyBadge = () => (
  <span 
    className="anomaly-badge"
    style={{
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.62rem',
      fontWeight: 700,
      backgroundColor: 'rgba(168, 85, 247, 0.15)',
      color: '#a855f7',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}
  >
    <Brain size={10} /> AI Anomaly
  </span>
);

export const Sparkline = ({ history, isAnomaly }) => {
  if (!Array.isArray(history) || history.length < 2) {
    return (
      <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Collecting data…</span>
      </div>
    );
  }

  const W = 220;
  const H = 36;
  const PAD = 4;
  const drawW = W - PAD * 2;
  const drawH = H - PAD * 2;

  const safeHistory = history.map(v => (typeof v === 'number' && !isNaN(v) ? v : 0));
  const min = Math.min(...safeHistory);
  const max = Math.max(...safeHistory);
  const range = max - min || 0.001;

  const toX = (i) => PAD + (i / (safeHistory.length - 1)) * drawW;
  const toY = (v) => PAD + drawH - ((v - min) / range) * drawH;

  const points = safeHistory.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  const areaPoints = [
    `${PAD},${H - PAD}`,
    ...safeHistory.map((v, i) => `${toX(i)},${toY(v)}`),
    `${W - PAD},${H - PAD}`,
  ].join(' ');

  const lineColor  = isAnomaly ? '#a855f7' : '#3b82f6';
  const fillColor  = isAnomaly ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.1)';

  const lastIdx = safeHistory.length - 1;
  const lastX   = toX(lastIdx);
  const lastY   = toY(safeHistory[lastIdx]);
  const dotColor = isAnomaly ? '#ef4444' : '#3b82f6';

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <polygon points={areaPoints} fill={fillColor} />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={isAnomaly ? 4 : 3} fill={dotColor}
        style={isAnomaly ? { filter: 'drop-shadow(0 0 4px #ef4444)' } : {}} />
    </svg>
  );
};
