import React, { useMemo, useRef, useEffect, useState } from 'react';
import { SYSTEM_THRESHOLDS } from '../config/systemThresholds';
import { useParams } from 'react-router-dom';
import { Activity, Zap, Thermometer, FlaskConical, Signal, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const TREND_MAX = 30; // keep last 30 data points

const fmt = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(parseFloat(val))) return '--';
  return parseFloat(val).toFixed(decimals);
};

import { AnomalyBadge, Sparkline } from './AnomalyUI';
import { Brain } from 'lucide-react';

const NODE_META = {
  t104: { location: 'Cooling Tower 2, North Wing',  color: '#3b82f6' },
  t105: { location: 'Sector 7G, Industrial Bay 4',  color: '#8b5cf6' },
  t106: { location: 'Main Generator Room',           color: '#10b981' },
};

const NodePage = ({ nodesData, awsStatus }) => {
  const { id } = useParams();

  // Safe extraction of specific node data
  const data = nodesData?.[id];
  const meta = NODE_META[id] || { location: 'Unknown', color: '#3b82f6' };
  
  const isAnomaly = data?.isAnomaly || false;
  const anomalyReason = data?.anomalyReason || '';
  const healthScore = typeof data?.healthScore === 'number' ? data.healthScore : 0;
  const healthHistory = Array.isArray(data?.healthHistory) ? data.healthHistory : [];
  const status = data?.status || 'HEALTHY';
  const subHealth = data?.subNodeHealth || { A: { healthScore: 0 }, B: { healthScore: 0 }, C: { healthScore: 0 } };

  // ── Rolling trend buffer ──────────────────────────────────────────────────────
  // We keep a ref-backed array so we can push into it without losing history
  // across renders, and expose it as state so the chart re-renders.
  const trendRef = useRef(
    Array.from({ length: TREND_MAX }, (_, i) => ({
      time: `t-${TREND_MAX - i}`,
      voltage: 0,
      temperature: 0,
      loadFactor: 0,
    }))
  );
  const [trendData, setTrendData] = useState(trendRef.current);

  // Push a point every time data changes (i.e. every time a new message arrives)
  const prevDataRef = useRef(null);
  useEffect(() => {
    if (!data) return;
    // Only add a point if data actually changed
    if (prevDataRef.current === data) return;
    prevDataRef.current = data;

    const point = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      voltage:     parseFloat(data.voltage)     || 0,
      temperature: parseFloat(data.temperature) || 0,
      loadFactor:  parseFloat(data.loadFactor)  || 0,
    };

    const next = [...trendRef.current.slice(1), point];
    trendRef.current = next;
    setTrendData(next);
  }, [data]);

  // ── Mini bar data (last 8 loadFactor readings) ────────────────────────────────
  const barData = useMemo(() => {
    return trendData.slice(-8).map(p => ({ value: p.loadFactor * 100 }));
  }, [trendData]);

  // ── Metric cards ──────────────────────────────────────────────────────────────
  const metricsData = [
    {
      title: 'VOLTAGE OUTPUT',
      value: fmt(data?.voltage, 1),
      unit: 'kV',
      icon: Zap,
      status: data?.voltage ? ((parseFloat(data.voltage) < SYSTEM_THRESHOLDS.voltage.low || parseFloat(data.voltage) > SYSTEM_THRESHOLDS.voltage.high) ? 'CAUTION' : 'NOMINAL') : 'WAITING',
      statColor: data?.voltage ? ((parseFloat(data.voltage) < SYSTEM_THRESHOLDS.voltage.low || parseFloat(data.voltage) > SYSTEM_THRESHOLDS.voltage.high) ? '#fca5a5' : '#93c5fd') : '#93c5fd',
    },
    {
      title: 'TOP OIL TEMP',
      value: fmt(data?.temperature, 1),
      unit: '°C',
      icon: Thermometer,
      status: parseFloat(data?.temperature) >= SYSTEM_THRESHOLDS.temperature.warning ? 'CAUTION' : (data?.temperature ? 'NOMINAL' : 'WAITING'),
      statColor: parseFloat(data?.temperature) >= SYSTEM_THRESHOLDS.temperature.warning ? '#fca5a5' : '#93c5fd',
    },
    {
      title: 'CURRENT LOAD',
      value: fmt(data?.current, 1),
      unit: 'A',
      icon: FlaskConical,
      status: data?.current ? 'NOMINAL' : 'WAITING',
      statColor: '#93c5fd',
    },
    {
      title: 'SIGNAL STRENGTH',
      value: fmt(data?.signal ?? (data ? SYSTEM_THRESHOLDS.signal.default : null), 0),
      unit: 'dBm',
      icon: Signal,
      status: data ? 'NOMINAL' : 'WAITING',
      statColor: '#93c5fd',
    },
  ];

  const statusColors = {
    HEALTHY:  { bg: 'rgba(16, 185, 129, 0.1)',  color: '#10b981', border: 'rgba(16, 185, 129, 0.2)'  },
    WARNING:  { bg: 'rgba(249, 115, 22, 0.1)',  color: '#f97316', border: 'rgba(249, 115, 22, 0.2)'  },
    CRITICAL: { bg: 'rgba(239, 68, 68, 0.1)',   color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)'   },
  };
  const sColor = statusColors[status] || statusColors.HEALTHY;

  return (
    <div className="node-page" style={{ padding: '0', display: 'flex', gap: '1.5rem', height: '100%' }}>
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Top Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>

          {/* Status Card */}
          <div 
            className="panel-card" 
            style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              border: isAnomaly ? '1px solid #a855f7' : '1px solid var(--panel-border)',
              boxShadow: isAnomaly ? '0 0 15px rgba(168, 85, 247, 0.2)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <div>
              {/* Back link */}
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1rem' }}>
                <ArrowLeft size={12} /> All Nodes
              </Link>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', letterSpacing: '1px' }}>
                  GLOBAL OPERATIONAL STATUS
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isAnomaly && <AnomalyBadge />}
                  {awsStatus === 'CONNECTED' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <Activity size={10} /> LIVE CLOUD
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 600, backgroundColor: sColor.bg, color: sColor.color, padding: '0.25rem 0.75rem', borderRadius: '1rem', border: `1px solid ${sColor.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: data ? sColor.color : '#64748b' }} />
                    {status}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>Node ID: {id?.toUpperCase() || 'UNKNOWN'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{meta.location}</div>
              
              {isAnomaly && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: 'rgba(168, 85, 247, 0.05)', 
                  border: '1px solid rgba(168, 85, 247, 0.2)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Brain size={14} />
                  <strong>AI Detection:</strong> {anomalyReason}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '3rem', marginTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>DATA STREAM</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: data ? '#10b981' : 'var(--text-muted)' }}>
                  {data ? 'RECEIVING' : 'WAITING'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>LOAD FACTOR</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {fmt(data?.loadFactor, 2)} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/1.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Current card */}
          <div className="panel-card" style={{ padding: '0', background: `linear-gradient(135deg, ${meta.color} 0%, #1e3a8a 100%)`, border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#93c5fd', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>PRIMARY CURRENT [A]</span>
                <Zap size={18} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', color: 'white' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-1px' }}>
                  {fmt(data?.current, 1)}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#93c5fd' }}>A</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Activity size={12} /> {data ? 'Live telemetry stream' : 'Waiting for data...'}
              </div>

              <div style={{ flex: 1, marginTop: '1.5rem', height: '100px', minHeight: '100px' }}>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={barData}>
                    <Bar dataKey="value" fill="rgba(255,255,255,0.25)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row — Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {metricsData.map((item, idx) => (
            <div key={idx} className="panel-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--panel-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={16} color={item.statColor} />
                </div>
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.5px',
                  color:            item.status === 'CAUTION' ? '#fca5a5' : item.status === 'WAITING' ? 'var(--text-muted)' : '#93c5fd',
                  backgroundColor:  item.status === 'CAUTION' ? 'rgba(239, 68, 68, 0.1)' : item.status === 'WAITING' ? 'var(--panel-bg-hover)' : 'rgba(59, 130, 246, 0.1)',
                  padding: '0.25rem 0.5rem', borderRadius: '4px',
                }}>
                  {item.status}
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{item.title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', flex: 1 }}>
          <div className="panel-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#60a5fa', letterSpacing: '1px', marginBottom: '0.25rem' }}>ANALYTICS ENGINE</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 500 }}>Real-time Voltage Trend — {id?.toUpperCase()}</h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 2, backgroundColor: meta.color, display: 'inline-block', borderRadius: 2 }} /> Voltage (kV)
                </span>
              </div>
            </div>

            <div style={{ width: '100%', flex: 1, minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={meta.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={meta.color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="var(--panel-border)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={true}
                    minTickGap={40}
                    tick={{ fill: 'var(--text-muted)' }}
                    dy={8}
                  />
                  <YAxis
                    stroke="var(--panel-border)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--text-muted)' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '6px', fontSize: '0.75rem' }}
                    labelStyle={{ color: 'var(--text-secondary)' }}
                    itemStyle={{ color: meta.color }}
                    formatter={(v) => [`${v} kV`, 'Voltage']}
                  />
                  <Area
                    type="monotone"
                    dataKey="voltage"
                    stroke={meta.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#grad-${id})`}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Risk & Health Section */}
          <div className="panel-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: isAnomaly ? '1px solid #a855f7' : '1px solid var(--panel-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={18} color="#a855f7" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>AI RISK ANALYSIS</span>
            </div>

            {/* Health Score */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>System Health Score</span>
                <span style={{ fontWeight: 700, color: isAnomaly ? '#a855f7' : '#10b981' }}>{(1 - healthScore).toFixed(4)}</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--panel-bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.max(0, (1 - healthScore) * 100)}%`, 
                  height: '100%', 
                  background: isAnomaly ? '#a855f7' : 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #10b981 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Health Trend Sparkline */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>HEALTH TREND (20m)</div>
              <div style={{ backgroundColor: 'var(--panel-bg-hover)', padding: '0.5rem', borderRadius: '4px' }}>
                <Sparkline history={healthHistory} isAnomaly={isAnomaly} />
              </div>
            </div>

            {/* Phase Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
               <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PHASE LOAD ANALYSIS</div>
               {['A', 'B', 'C'].map(phase => (
                 <div key={phase} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phase {phase}</span>
                    <span style={{ fontWeight: 600, color: (subHealth[phase]?.healthScore >= SYSTEM_THRESHOLDS.healthScore.criticalThreshold) ? '#ef4444' : (subHealth[phase]?.healthScore >= SYSTEM_THRESHOLDS.healthScore.warningThreshold) ? '#f97316' : '#10b981' }}>
                       {subHealth[phase]?.healthScore >= SYSTEM_THRESHOLDS.healthScore.criticalThreshold ? 'Critical' : subHealth[phase]?.healthScore >= SYSTEM_THRESHOLDS.healthScore.warningThreshold ? 'Warning' : 'Optimal'}
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePage;
