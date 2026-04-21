import React from 'react';
import { SYSTEM_THRESHOLDS } from '../config/systemThresholds';
import { Link } from 'react-router-dom';
import { AnomalyBadge, Sparkline } from './AnomalyUI';
import { LayoutDashboard, AlertCircle, Zap, Thermometer, Activity, Signal, Cpu, Brain } from 'lucide-react';

// ─── Alert badge helpers ─────────────────────────────────────────────────────
const getAlertBadgeStyle = (alert) => {
  if (!alert || alert === 'NORMAL') {
    return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)', blink: false };
  }
  if (alert.includes('CRITICAL_TEMP') || alert.includes('HIGH_TEMP')) {
    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', blink: alert.includes('CRITICAL_TEMP') };
  }
  if (alert.includes('UNDER_VOLTAGE') || alert.includes('HIGH_VOLTAGE')) {
    return { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: 'rgba(249, 115, 22, 0.2)', blink: false };
  }
  if (alert.includes('OVERLOAD')) {
    return { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.2)', blink: false };
  }
  return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', blink: false };
};

const getAlertBorderColor = (alert) => {
  if (!alert) return '#ef4444';
  if (alert.includes('CRITICAL_TEMP') || alert.includes('HIGH_TEMP')) return '#ef4444';
  if (alert.includes('UNDER_VOLTAGE') || alert.includes('HIGH_VOLTAGE')) return '#f97316';
  if (alert.includes('OVERLOAD')) return '#a855f7';
  return '#ef4444';
};

const fmt = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(parseFloat(val))) return '—';
  return parseFloat(val).toFixed(decimals);
};

const NODE_LABELS = {
  t104: { location: 'Cooling Tower 2, North Wing' },
  t105: { location: 'Sector 7G, Industrial Bay 4' },
  t106: { location: 'Main Generator Room' },
};

// ─── Telemetry metric row ────────────────────────────────────────────────────
const MetricRow = ({ icon: Icon, label, value, unit, color = '#93c5fd' }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'var(--panel-bg-hover)', padding: '0.65rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
  }}>
    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <Icon size={14} color={color} /> {label}
    </span>
    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
      {value} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unit}</span>
    </span>
  </div>
);

// ─── Main view ───────────────────────────────────────────────────────────────
const NodesView = ({ nodesData, liveAlerts }) => {
  const nodeKeys = ['t104', 't105', 't106'];

  const safeNodesData  = nodesData  || {};
  const safeLiveAlerts = liveAlerts || [];

  return (
    <div className="nodes-view" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutDashboard size={22} /> Multi-Node Monitoring
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {nodeKeys.length} nodes active • click a card to view full telemetry
        </span>
      </div>

      {/* ─── NODE TELEMETRY CARDS ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {nodeKeys.map(nodeId => {
          const data        = safeNodesData[nodeId] || {};
          const alert       = data.alert || 'NORMAL';
          const badgeStyle  = getAlertBadgeStyle(alert);
          const hasData     = !!(data.temperature || data.voltage);
          const location    = NODE_LABELS[nodeId]?.location || '';

          return (
            <Link key={nodeId} to={`/node/${nodeId}`} style={{ textDecoration: 'none' }}>
              <div
                className="panel-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  border: badgeStyle.blink ? '1px solid #ef4444' : '1px solid var(--panel-border)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(59,130,246,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = badgeStyle.blink ? '#ef4444' : 'var(--panel-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Node {nodeId.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {location}
                    </div>
                  </div>
                  <span
                    className={badgeStyle.blink ? 'blink-animation' : ''}
                    style={{
                      padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700,
                      backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {alert}
                  </span>
                </div>

                {/* Status dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: hasData ? '#10b981' : '#64748b',
                    display: 'inline-block',
                    boxShadow: hasData ? '0 0 6px #10b981' : 'none',
                  }} />
                  <span style={{ fontSize: '0.65rem', color: hasData ? '#10b981' : 'var(--text-muted)' }}>
                    {hasData ? 'RECEIVING DATA' : 'WAITING FOR DATA'}
                  </span>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <MetricRow icon={Thermometer} label="TOP OIL TEMP"    value={fmt(data.temperature, 1)} unit="°C"  color={parseFloat(data.temperature) >= SYSTEM_THRESHOLDS.temperature.warning ? '#ef4444' : '#f97316'} />
                  <MetricRow icon={Zap}         label="VOLTAGE OUTPUT"  value={fmt(data.voltage, 1)}     unit="kV"  color="#60a5fa" />
                  <MetricRow icon={Cpu}         label="CURRENT LOAD"    value={fmt(data.current, 1)}     unit="A"   color="#a78bfa" />
                  <MetricRow icon={Activity}    label="LOAD FACTOR"     value={fmt(data.loadFactor, 2)}  unit=""    color="#34d399" />
                  <MetricRow icon={Signal}      label="SIGNAL STRENGTH" value={fmt(data.signal ?? (hasData ? SYSTEM_THRESHOLDS.signal.default : null), 0)} unit="dBm" color="#94a3b8" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── SYSTEM HEALTH DASHBOARD ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={22} color="#a855f7" /> System Health Dashboard
          </h3>
          <span style={{ fontSize: '0.7rem', color: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
            AI Anomaly Detection Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {nodeKeys.map(nodeId => {
            const data         = safeNodesData[nodeId] || {};
            const healthScore  = typeof data.healthScore === 'number' && !isNaN(data.healthScore) ? data.healthScore : 0;
            const status       = data.status       || 'HEALTHY';
            const isAnomaly    = data.isAnomaly    || false;
            const anomalyReason = data.anomalyReason || '';
            const healthHistory = Array.isArray(data.healthHistory) ? data.healthHistory : [];
            const location     = data.location || NODE_LABELS[nodeId]?.location || 'Unknown';
            const subHealth    = data.subNodeHealth || {
              A: { healthScore: 0 },
              B: { healthScore: 0 },
              C: { healthScore: 0 },
            };

            const statusColors = {
              HEALTHY:  { bg: 'rgba(16, 185, 129, 0.1)',  color: '#10b981', border: 'rgba(16, 185, 129, 0.2)'  },
              WARNING:  { bg: 'rgba(249, 115, 22, 0.1)',  color: '#f97316', border: 'rgba(249, 115, 22, 0.2)'  },
              CRITICAL: { bg: 'rgba(239, 68, 68, 0.1)',   color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)'   },
            };

            const sColor       = statusColors[status] || statusColors.HEALTHY;
            const healthPercent = Math.min(100, Math.max(0, healthScore * 100));

            const barGradient = healthScore >= SYSTEM_THRESHOLDS.healthScore.criticalThreshold
              ? 'linear-gradient(90deg, #10b981 0%, #f97316 30%, #ef4444 100%)'
              : healthScore >= SYSTEM_THRESHOLDS.healthScore.warningThreshold
              ? 'linear-gradient(90deg, #10b981 0%, #f97316 100%)'
              : '#10b981';

            const getPhaseStatus = (score) => {
              if (score >= SYSTEM_THRESHOLDS.healthScore.criticalThreshold) return { label: 'CRITICAL', color: '#ef4444', icon: '🔴' };
              if (score >= SYSTEM_THRESHOLDS.healthScore.warningThreshold)  return { label: 'WARNING',  color: '#f97316', icon: '🟠' };
              return              { label: 'OK',       color: '#10b981', icon: '🟢' };
            };

            // Card border & shadow — anomaly layered on top of status styling
            const cardBorderColor = isAnomaly
              ? '#a855f7'
              : status === 'CRITICAL'
              ? '#ef4444'
              : 'var(--panel-border)';

            const cardBoxShadow = isAnomaly
              ? '0 0 0 1px rgba(168,85,247,0.4), 0 0 18px rgba(168,85,247,0.2)'
              : status === 'CRITICAL'
              ? '0 0 10px rgba(239,68,68,0.18)'
              : 'none';

            return (
              <div
                key={`health-${nodeId}`}
                className="panel-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  border: `1px solid ${cardBorderColor}`,
                  boxShadow: cardBoxShadow,
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              >
                {/* ── Card Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Node {nodeId.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {location}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    {/* Status badge */}
                    <span
                      className={status === 'CRITICAL' ? 'blink-animation' : ''}
                      style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700, backgroundColor: sColor.bg, color: sColor.color, border: `1px solid ${sColor.border}`, whiteSpace: 'nowrap' }}
                    >
                      {status}
                    </span>
                    {/* AI Anomaly badge */}
                    {isAnomaly && <AnomalyBadge />}
                  </div>
                </div>

                {/* ── Anomaly Reason ── */}
                {isAnomaly && anomalyReason && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: '#c084fc',
                    backgroundColor: 'rgba(168,85,247,0.08)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontStyle: 'italic',
                  }}>
                    <Brain size={11} color="#a855f7" />
                    {anomalyReason}
                  </div>
                )}

                {/* ── Health Score Bar ── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Risk Score</span>
                    <span style={{ fontWeight: 700, color: sColor.color }}>{healthScore.toFixed(3)}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--panel-bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${healthPercent}%`, height: '100%', background: barGradient, borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
                    <span style={{ color: '#10b981' }}>0.0 ───────</span>
                    <span style={{ color: '#f97316' }}>{SYSTEM_THRESHOLDS.healthScore.warningThreshold} ───────</span>
                    <span style={{ color: '#ef4444' }}>{SYSTEM_THRESHOLDS.healthScore.criticalThreshold} ───────</span>
                    <span>1.0</span>
                  </div>
                </div>

                {/* ── Sparkline Trend ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.4px' }}>
                      HEALTH TREND
                    </span>
                    <span style={{ fontSize: '0.58rem', color: isAnomaly ? '#a855f7' : 'var(--text-muted)' }}>
                      {healthHistory.length} readings
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: 'var(--panel-bg-hover)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.5rem',
                    border: isAnomaly ? '1px solid rgba(168,85,247,0.2)' : '1px solid transparent',
                  }}>
                    <Sparkline history={healthHistory} isAnomaly={isAnomaly} />
                  </div>
                </div>

                {/* ── Phase Analysis ── */}
                <div style={{ backgroundColor: 'var(--panel-bg-hover)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>PHASE ANALYSIS</div>
                  {['A', 'B', 'C'].map(phase => {
                    const pScore  = typeof subHealth[phase]?.healthScore === 'number' ? subHealth[phase].healthScore : 0;
                    const pStatus = getPhaseStatus(pScore);
                    return (
                      <div key={phase} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, width: '55px' }}>Phase {phase}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Risk: {pScore.toFixed(3)}</span>
                        <span style={{ color: pStatus.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', width: '70px', justifyContent: 'flex-end' }}>
                          {pStatus.label} <span style={{ fontSize: '0.58rem' }}>{pStatus.icon}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ALERT PANEL ────────────────────────────────────────────────────── */}
      <div className="panel-card" style={{ padding: '1.5rem', flex: 1 }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> LIVE ALERT STREAM
        </h3>
        {safeLiveAlerts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recent alerts in the stream. All systems nominal.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {safeLiveAlerts.map((alert) => (
              <div key={alert.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', backgroundColor: 'var(--panel-bg-hover)', borderRadius: 'var(--radius-sm)',
                borderLeft: `4px solid ${getAlertBorderColor(alert.alert)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    [{alert.nodeId}]
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {alert.alert}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodesView;
