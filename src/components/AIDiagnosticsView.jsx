import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  History, 
  Zap, 
  Activity, 
  Trash2, 
  Download, 
  ShieldCheck, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { anomalyStore } from '../utils/anomalyStore';
import { SYSTEM_THRESHOLDS } from '../config/systemThresholds';

const AIDiagnosticsView = () => {
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // Initial fetch
    setRecords(anomalyStore.getRecords());

    // Subscribe to store updates
    const unsubscribe = anomalyStore.subscribe((newRecords) => {
      setRecords(newRecords);
    });

    return () => unsubscribe();
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear all diagnostic records?')) {
      anomalyStore.clear();
    }
  };

  const handleExport = () => {
    const json = anomalyStore.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Diagnostics_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="ai-diagnostics-view" style={{ padding: '0 2rem 2rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
            <Brain size={28} color="#a855f7" /> AI Anomaly <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Diagnostics</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Internal telemetry analysis and statistical data for project demonstration.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-outline" 
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} /> Export JSON
          </button>
          <button 
            className="btn-outline" 
            onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <Trash2 size={16} /> Clear Logs
          </button>
        </div>
      </div>

      {/* Threshold Overview */}
      <div className="panel-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' }}>
          Active AI Parameters
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Z-SCORE THRESHOLD</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{SYSTEM_THRESHOLDS.anomaly.zScoreThreshold}σ</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>HISTORY WINDOW</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{SYSTEM_THRESHOLDS.anomaly.maxHistoryLength} Points</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>SUDDEN JUMP LIMIT</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>+{SYSTEM_THRESHOLDS.anomaly.suddenDropThreshold * 100}% Risk</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PREDICTION HORIZON</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{SYSTEM_THRESHOLDS.prediction.futureSteps} Steps</div>
          </div>
        </div>
      </div>

      {/* Analytics Console */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--panel-border)', background: 'var(--panel-bg-hover)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ANALYSIS LOG (LATEST {records.length})</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time Internal Store</span>
        </div>
        
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {records.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <History size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p>Waiting for diagnostic telemetry data...</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Target Node</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Z-Score</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Health Score</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>Prediction</th>
                  <th style={{ padding: '1rem', fontWeight: 500 }}>AI Status</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr style={{ 
                      borderBottom: '1px solid var(--panel-border)', 
                      background: record.isAnomaly ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                      transition: 'background 0.2s'
                    }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.nodeId.toUpperCase()}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(record.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          color: record.zScore > SYSTEM_THRESHOLDS.anomaly.zScoreThreshold ? '#f87171' : 'var(--text-primary)',
                          fontWeight: record.zScore > SYSTEM_THRESHOLDS.anomaly.zScoreThreshold ? 700 : 400
                        }}>
                          {record.zScore.toFixed(3)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '40px', height: '4px', background: 'var(--panel-border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${record.currentHealthScore * 100}%`, height: '100%', background: '#10b981' }}></div>
                          </div>
                          <span>{record.currentHealthScore.toFixed(4)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {record.predictedHealthScore ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: record.predictedStatus === 'CRITICAL' ? '#f87171' : 'var(--text-secondary)' }}>
                            {record.predictedStatus === 'CRITICAL' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                            {record.predictedHealthScore.toFixed(3)}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {record.isAnomaly ? (
                          <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            ANOMALY
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ShieldCheck size={14} /> NOMINAL
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => toggleExpand(record.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                        >
                          {expandedId === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === record.id && (
                      <tr>
                        <td colSpan="6" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--panel-border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                            <div>
                              <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Stats Detail</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Mean:</span>
                                  <span>{record.mean}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Std Dev:</span>
                                  <span>{record.stdDev}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Sudden Jump:</span>
                                  <span style={{ color: record.suddenDropDetected ? '#f87171' : '#10b981' }}>{record.suddenDropDetected ? 'YES' : 'NO'}</span>
                                </div>
                                {record.isAnomaly && (
                                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', fontSize: '0.75rem', color: '#fca5a5' }}>
                                    <strong>REASON:</strong> {record.anomalyReason}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Health History Buffer</h4>
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: '60px' }}>
                                  {record.recentHistory.map((h, i) => (
                                    <div 
                                      key={i} 
                                      style={{ 
                                        flex: 1, 
                                        height: `${h * 100}%`, 
                                        background: i === record.recentHistory.length - 1 ? '#a855f7' : 'rgba(168, 85, 247, 0.3)',
                                        borderRadius: '1px'
                                      }}
                                      title={`Val: ${h.toFixed(3)}`}
                                    ></div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  <span>T-{record.recentHistory.length}</span>
                                  <span>Now (T-0)</span>
                                </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDiagnosticsView;
