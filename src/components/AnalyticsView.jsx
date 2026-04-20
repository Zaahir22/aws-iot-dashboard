import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Thermometer, ArrowUpRight, Copy, AlertTriangle, Download, Brain } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{label}</p>
        {payload.map((entry, index) => {
          const phaseLabel = entry.name === 'phaseA' ? 'A' : entry.name === 'phaseB' ? 'B' : 'C';
          const val = typeof entry.value === 'number' ? entry.value.toFixed(1) : '—';
          return (
            <p key={index} style={{ color: entry.color, fontWeight: 600, fontSize: '0.875rem' }}>
              Phase {phaseLabel}: {val}kV
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const AnalyticsView = ({ data, onExportCSV, onFullReport, awsStatus }) => {
  const [timeRange, setTimeRange] = useState('24H');
  const [customDays, setCustomDays] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);

  const displayData = useMemo(() => {
    if (!data?.trendData) return [];
    if (timeRange === '24H') return data.trendData;
    
    let days = 7;
    if (timeRange === '30D') days = 30;
    else if (timeRange.startsWith('Custom')) {
      const match = timeRange.match(/\((\d+)D\)/);
      days = match ? parseInt(match[1]) : 7;
    }

    return Array.from({ length: days }).map((_, i) => ({
      time: `D${i + 1}`,
      phaseA: 5 + Math.sin(i) * 1.5 + (i % 10) / 5,
      phaseB: 4 + Math.cos(i) * 1.2 + (i % 8) / 8,
      phaseC: 6 + Math.sin(i/2) * 2 + (i % 5) / 5,
    }));
  }, [data, timeRange]);

  if (!data) return <div style={{ color: 'var(--text-primary)' }}>Loading telemetry...</div>;

  const handleRangeClick = (range) => {
    setTimeRange(range);
    setIsCustomInput(false);
  };

  const handleCustomSubmit = (e) => {
    if (e.key === 'Enter') {
      if (customDays && !isNaN(customDays)) {
        setTimeRange(`Custom (${customDays}D)`);
      }
      setIsCustomInput(false);
    }
  };

  return (
    <div className="analytics-view">
      {/* Top KPIs */}
      <div className="kpi-grid">
        <div className="panel-card kpi-card kpi-primary">
          <div className="kpi-header">
            <span className="kpi-title">Average Load Factor</span>
            <Copy size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value">
            {data.loadFactor !== null && data.loadFactor !== undefined ? parseFloat(data.loadFactor).toFixed(2) : '—'}<span className="kpi-unit">A</span>
          </div>
          <div className="kpi-trend trend-up">
            <ArrowUpRight size={14} />
            <span>1.2%</span> <span style={{color: 'var(--text-secondary)', marginLeft: 4}}>vs previous 24h</span>
          </div>
        </div>

        <div className="panel-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Peak Voltage Pulse</span>
            <Zap size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value">
            {data.peakVoltage !== null && data.peakVoltage !== undefined ? parseFloat(data.peakVoltage).toFixed(2) : '—'}<span className="kpi-unit">kV</span>
          </div>
          <div className="kpi-alert">
            <AlertTriangle size={14} />
            <strong>Nominal Breach</strong>
            <span style={{color: 'var(--text-secondary)'}}>Recorded at 02:15 AM</span>
          </div>
        </div>

        <div className="panel-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Mean Oil Temp</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }}></div>
          </div>
          <div className="kpi-value">
            {data.meanOilTemp !== null && data.meanOilTemp !== undefined ? parseFloat(data.meanOilTemp).toFixed(2) : '—'}<span className="kpi-unit">°C</span>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '4px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ 
                height: 24, 
                flex: 1, 
                backgroundColor: i === 3 ? 'var(--accent-blue)' : 'var(--panel-bg-hover)',
                borderRadius: 2
              }}></div>
            ))}
          </div>
        </div>

        {/* AI Health Summary KPI */}
        <div className="panel-card kpi-card" style={{ 
          border: data.anomalyCount > 0 ? '1px solid #a855f7' : '1px solid var(--panel-border)',
          background: data.anomalyCount > 0 ? 'rgba(168, 85, 247, 0.05)' : 'var(--panel-bg)'
        }}>
          <div className="kpi-header">
            <span className="kpi-title">AI System Risk Index</span>
            <Brain size={16} color="#a855f7" />
          </div>
          <div className="kpi-value" style={{ color: data.anomalyCount > 0 ? '#a855f7' : '#10b981' }}>
            {(data.avgHealth || 0).toFixed(3)}
          </div>
          <div className="kpi-trend" style={{ color: data.anomalyCount > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
            {data.anomalyCount > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} /> {data.anomalyCount} Active Anomalies
              </span>
            ) : (
              <span>All patterns nominal</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="panel-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Voltage Stability Trend</h2>
              {awsStatus === 'CONNECTED' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <Activity size={10} /> LIVE CLOUD
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Aggregated telemetry data across Phase A, B, and C units.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: 4, gap: '4px', alignItems: 'center' }}>
              <button 
                className="btn-outline" 
                style={{ border: 'none', padding: '0.25rem 0.75rem', backgroundColor: timeRange === '24H' ? 'var(--accent-blue)' : 'transparent', color: timeRange === '24H' ? 'white' : 'var(--text-primary)' }}
                onClick={() => handleRangeClick('24H')}
              >24H</button>
              <button 
                className="btn-outline" 
                style={{ border: 'none', padding: '0.25rem 0.75rem', backgroundColor: timeRange === '7D' ? 'var(--accent-blue)' : 'transparent', color: timeRange === '7D' ? 'white' : 'var(--text-primary)' }}
                onClick={() => handleRangeClick('7D')}
              >7D</button>
              <button 
                className="btn-outline" 
                style={{ border: 'none', padding: '0.25rem 0.75rem', backgroundColor: timeRange === '30D' ? 'var(--accent-blue)' : 'transparent', color: timeRange === '30D' ? 'white' : 'var(--text-primary)' }}
                onClick={() => handleRangeClick('30D')}
              >30D</button>
              
              {isCustomInput ? (
                <input 
                  type="number" 
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  onKeyDown={handleCustomSubmit}
                  placeholder="Days"
                  style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--accent-blue)', backgroundColor: 'var(--panel-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }}
                  autoFocus
                  onBlur={() => {
                    if(customDays && !isNaN(customDays)) {
                      setTimeRange(`Custom (${customDays}D)`);
                    }
                    setIsCustomInput(false);
                  }}
                />
              ) : (
                <button 
                  className="btn-outline" 
                  style={{ border: 'none', padding: '0.25rem 0.75rem', backgroundColor: timeRange.startsWith('Custom') ? 'var(--accent-blue)' : 'transparent', color: timeRange.startsWith('Custom') ? 'white' : 'var(--text-primary)' }}
                  onClick={() => setIsCustomInput(true)}
                >
                  {timeRange.startsWith('Custom') ? timeRange : 'Custom'}
                </button>
              )}
            </div>
            <button className="btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--panel-bg-hover)' }} onClick={() => onExportCSV(displayData, `Voltage_Trend_${timeRange}`)}>
              <Download size={14} /> EXPORT CSV
            </button>
            <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }} onClick={onFullReport}>
              FULL REPORT
            </button>
          </div>
        </div>
        
        <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={displayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPhaseA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kV`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="phaseA"
                stroke="var(--accent-blue)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPhaseA)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="phaseB"
                stroke="var(--text-muted)"
                strokeDasharray="5 5"
                strokeWidth={2}
                fillOpacity={0}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="phaseC"
                stroke="var(--accent-cyan)"
                strokeDasharray="3 3"
                strokeWidth={2}
                fillOpacity={0}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="panel-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
          {/* Abstract map placeholder */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'radial-gradient(circle at 100% 100%, var(--accent-blue-glow) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 19px, var(--panel-border) 19px, var(--panel-border) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, var(--panel-border) 19px, var(--panel-border) 20px)',
            opacity: 0.3
          }}></div>
          <div style={{ position: 'relative', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
             <div style={{ backgroundColor: 'var(--panel-bg)', backdropFilter: 'blur(4px)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', alignSelf: 'flex-start', border: '1px solid var(--panel-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Regional Unit Distribution</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Munich North Hub</div>
             </div>
             
             {/* Map marker dot */}
             <div style={{ position: 'absolute', bottom: '30%', left: '40%', width: 12, height: 12, backgroundColor: 'var(--accent-blue)', borderRadius: '50%', boxShadow: '0 0 16px var(--accent-blue-glow)'}}>
                <div style={{ position: 'absolute', inset: -8, border: '1px solid var(--accent-blue)', borderRadius: '50%', opacity: 0.5 }}></div>
             </div>

             <div style={{ position: 'absolute', top: '10%', right: '10%', width: 12, height: 12, backgroundColor: 'var(--accent-cyan)', borderRadius: '50%', boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'}}>
                <div style={{ position: 'absolute', inset: -8, border: '1px solid var(--accent-cyan)', borderRadius: '50%', opacity: 0.5 }}></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default AnalyticsView;
