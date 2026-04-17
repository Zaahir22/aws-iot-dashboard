import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Zap, Thermometer, FlaskConical, Database } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';

// Stable static fallback data for charts only
const STATIC_LOAD_TREND = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i < 10 ? '0' + i : i}:00`,
  value: 0,
}));

const STATIC_BAR_DATA = [
  { value: 40 }, { value: 65 }, { value: 45 }, { value: 30 },
  { value: 80 }, { value: 55 }, { value: 70 }, { value: 90 },
];

const fmt = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(parseFloat(val))) return '--';
  return parseFloat(val).toFixed(decimals);
};

const NodePage = ({ nodesData, awsStatus }) => {
  const { id } = useParams();
  
  // Safe extraction of specific node data
  const data = nodesData?.[id];

  // Derive charts
  const loadTrendData = useMemo(() => {
    if (!data?.loadFactor) return STATIC_LOAD_TREND;
    // We can simulate a live trend or keep static
    const newData = [...STATIC_LOAD_TREND];
    newData[newData.length - 1] = { time: 'Now', value: parseFloat(data.loadFactor) || 0 };
    return newData;
  }, [data]);

  const barData = STATIC_BAR_DATA;

  // Live metrics bound to node data
  const metricsData = [
    {
      title: 'VOLTAGE OUTPUT',
      value: fmt(data?.voltage),
      unit: 'kV',
      icon: Zap,
      status: data?.voltage ? 'NOMINAL' : 'WAITING',
      statColor: '#93c5fd',
    },
    {
      title: 'TOP OIL TEMP',
      value: fmt(data?.temperature),
      unit: '°C',
      icon: Thermometer,
      status: parseFloat(data?.temperature) > 75 ? 'CAUTION' : (data?.temperature ? 'NOMINAL' : 'WAITING'),
      statColor: parseFloat(data?.temperature) > 75 ? '#fca5a5' : '#93c5fd',
    },
    {
      title: 'CURRENT LOAD',
      value: fmt(data?.current),
      unit: 'A',
      icon: FlaskConical,
      status: data?.current ? 'NOMINAL' : 'WAITING',
      statColor: '#93c5fd',
    },
    {
      title: 'SIGNAL STRENGTH',
      value: fmt(data?.signal, 0),
      unit: 'dBm',
      icon: Database,
      status: data?.signal ? 'NOMINAL' : 'WAITING',
      statColor: '#93c5fd',
    },
  ];

  return (
    <div className="node-page" style={{ padding: '0', display: 'flex', gap: '1.5rem', height: '100%' }}>
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          
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
                    {data ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>Node ID: {id?.toUpperCase() || 'UNKNOWN'}</div>
            </div>

            <div style={{ display: 'flex', gap: '3rem', marginTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>DATA STREAM</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}><span style={{ fontSize: '1.2rem', fontWeight: 600, color: data ? '#10b981' : 'var(--text-muted)' }}>{data ? 'RECEIVING' : 'WAITING'}</span></div>
              </div>
            </div>
          </div>

          <div className="panel-card" style={{ padding: '0', background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#93c5fd', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>PRIMARY CURRENT [A]</span>
                <Zap size={18} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', color: 'white' }}>
                <span style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-1px' }}>
                  {fmt(data?.current)}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#93c5fd' }}>A</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Activity size={12} /> Live telemetry stream
              </div>

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

        {/* Middle Row Cards */}
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

        {/* Analytics Engine */}
        <div className="panel-card" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#60a5fa', letterSpacing: '1px', marginBottom: '0.25rem' }}>ANALYTICS ENGINE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500 }}>Real-time Trend Representation</h3>
            </div>
          </div>

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
    </div>
  );
};

export default NodePage;
