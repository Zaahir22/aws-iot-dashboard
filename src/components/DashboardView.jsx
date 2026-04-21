import React from 'react';
import { SYSTEM_THRESHOLDS } from '../config/systemThresholds';
import { Activity, Zap, Thermometer, FlaskConical, Database, AlertCircle, Info, FileText } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';

// Stable static fallback data for charts only (no metric value fallbacks)
const STATIC_LOAD_TREND = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i < 10 ? '0' + i : i}:00`,
  value: 0,
}));

const STATIC_BAR_DATA = [
  { value: 40 }, { value: 65 }, { value: 45 }, { value: 30 },
  { value: 80 }, { value: 55 }, { value: 70 }, { value: 90 },
];

// Helper: format a numeric value safely
const fmt = (val, decimals = 1) => {
  if (val === null || val === undefined) return '—';
  const n = parseFloat(val);
  return isNaN(n) ? '—' : n.toFixed(decimals);
};

const DashboardView = ({ data, onExportCSV, onFullReport, awsStatus }) => {
  const loadTrendData = data?.trendData && data.trendData.length > 0
    ? data.trendData
    : STATIC_LOAD_TREND;

  const barData = STATIC_BAR_DATA;

  // ── Live metrics bound to AWS data ──────────────────────────────────────────
  const metricsData = [
    {
      title: 'VOLTAGE OUTPUT',
      value: fmt(data?.peakVoltage),
      unit: 'kV',
      icon: Zap,
      status: 'NOMINAL',
      statColor: '#93c5fd',
    },
    {
      title: 'TOP OIL TEMP',
      value: fmt(data?.meanOilTemp),
      unit: '°C',
      icon: Thermometer,
      status: 'CAUTION',
      statColor: '#fca5a5',
    },
    {
      title: 'LOAD FACTOR',
      value: fmt(data?.loadFactor),
      unit: 'A',
      icon: FlaskConical,
      status: 'NOMINAL',
      statColor: '#93c5fd',
    },
    {
      title: 'SIGNAL STRENGTH',
      value: fmt(data?.signalStrength, 0),
      unit: 'dBm',
      icon: Database,
      status: 'NOMINAL',
      statColor: '#93c5fd',
    },
  ];

  return (
    <div className="dashboard-view" style={{ padding: '0', display: 'flex', gap: '1.5rem', height: '100%' }}>

      {/* Left Main Content */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Top Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>

          {/* Operational Status */}
          <div className="panel-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', letterSpacing: '1px' }}>GLOBAL OPERATIONAL STATUS</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {awsStatus === 'CONNECTED' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <Activity size={10} /> LIVE CLOUD
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#93c5fd' }}></div>
                    NOMINAL
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>Operational Integrity: 98.4%</div>
            </div>

            <div style={{ display: 'flex', gap: '3rem', marginTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>ACTIVE UPTIME</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}><span style={{ fontSize: '1.5rem', fontWeight: 600 }}>4,120</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HRS</span></div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>PHASE SYNC</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}><span style={{ fontSize: '1.5rem', fontWeight: 600 }}>120</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DEG</span></div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>HARMONICS (THD)</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}><span style={{ fontSize: '1.5rem', fontWeight: 600 }}>1.2</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>%</span></div>
              </div>
            </div>
          </div>

          {/* Primary Load — live loadFactor */}
          <div className="panel-card" style={{ padding: '0', background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#93c5fd', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>PRIMARY LOAD [A]</span>
                <Zap size={18} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', color: 'white' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-1px' }}>
                  {fmt(data?.loadFactor)}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#93c5fd' }}>A</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Activity size={12} /> Live telemetry stream
              </div>

              {/* Chart — fixed height wrapper to fix width(-1)/height(-1) error */}
              <div style={{ flex: 1, marginTop: '1.5rem', height: '100px', minHeight: '100px' }}>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={barData}>
                    <Bar dataKey="value" fill="rgba(255,255,255,0.2)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row Cards — all live */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {metricsData.map((item, idx) => (
            <div key={idx} className="panel-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--panel-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={16} color={item.statColor} />
                </div>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.5px', color: item.status === 'CAUTION' ? '#fca5a5' : '#93c5fd', backgroundColor: item.status === 'CAUTION' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
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

        {/* Analytics Engine — live trend chart */}
        <div className="panel-card" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#60a5fa', letterSpacing: '1px', marginBottom: '0.25rem' }}>ANALYTICS ENGINE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500 }}>Real-time Load Trend (24H)</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onExportCSV(loadTrendData, 'Phase_Load_Trend')}
                style={{ backgroundColor: 'var(--panel-bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >EXPORT CSV</button>
              <button
                onClick={onFullReport}
                style={{ backgroundColor: '#bfdbfe', color: '#1e3a8a', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >FULL REPORT</button>
            </div>
          </div>

          {/* Explicit height wrapper — fixes Recharts width(-1)/height(-1) error */}
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loadTrendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="var(--panel-border)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={true}
                  minTickGap={30}
                  tick={{ fill: 'var(--text-muted)' }}
                  dy={10}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Sidebar — System Alerts */}
      <div className="panel-card" style={{ width: '320px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>SYSTEM ALERTS</h3>
          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>3 NEW</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'var(--panel-bg-hover)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #f87171', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fca5a5' }}>CRITICAL THRESHOLD</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>12:45 PM</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              Top Oil Temp exceeds {SYSTEM_THRESHOLDS.temperature.warning}°C warning limit on Phase B.
            </p>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></div>
              Sensor: TEMP_B_04
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--panel-bg-hover)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #60a5fa', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#93c5fd' }}>SYSTEM NOTIFICATION</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>11:20 AM</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              Automated tap changer operation completed successfully.
            </p>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></div>
              Tap Pos: 12
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--panel-bg-hover)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--text-muted)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>LOG ENTRY</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>09:15 AM</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              Routine diagnostic scan initiated by User Operator 42.
            </p>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></div>
              Session: #9942
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--panel-bg-hover)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #f87171', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fca5a5' }}>CRITICAL THRESHOLD</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Yesterday</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              Minor pressure variation detected in Conservator Tank ...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
