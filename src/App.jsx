import { useState, useEffect, useCallback, useRef } from 'react';

// ─── AI Anomaly Detection (pure, no side-effects) ───────────────────────────
function detectAnomaly(history, current) {
  if (!Array.isArray(history) || history.length < 5) {
    return { isAnomaly: false, anomalyReason: '' };
  }
  const safeHistory = history.filter(v => typeof v === 'number' && !isNaN(v));
  if (safeHistory.length < 5) return { isAnomaly: false, anomalyReason: '' };

  const mean = safeHistory.reduce((a, b) => a + b, 0) / safeHistory.length;
  const variance = safeHistory.reduce((s, v) => s + (v - mean) ** 2, 0) / safeHistory.length;
  const stdDev = Math.sqrt(variance);

  // Guard against division by zero or near-zero stdDev
  if (stdDev < 0.001) return { isAnomaly: false, anomalyReason: '' };

  const safeCurrentVal = typeof current === 'number' && !isNaN(current) ? current : mean;
  const zScore = Math.abs((safeCurrentVal - mean) / stdDev);
  const suddenDrop = (mean - safeCurrentVal) > 0.15; // sharp health deterioration

  if (zScore > 2) {
    return { isAnomaly: true, anomalyReason: 'Unusual health trend deviation detected' };
  }
  if (suddenDrop) {
    return { isAnomaly: true, anomalyReason: 'Sudden health score deterioration detected' };
  }
  return { isAnomaly: false, anomalyReason: '' };
}
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import connectAWS from './aws-iot';
import {
  LayoutDashboard,
  BarChart3,
  Network,
  Settings,
  Bell,
  Moon,
  Sun,
  Cloud
} from 'lucide-react';
import './App.css';
import AnalyticsView from './components/AnalyticsView';
import NodesView from './components/NodesView';
import NodePage from './components/NodePage';
import AWSIoTView from './components/AWSIoTView';

// ─── Initial / default app data ────────────────────────────────────────────────
const INITIAL_APP_DATA = {
  trendData: Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    phaseA: 0,
    phaseB: 0,
    phaseC: 0,
    value:  0,
  })),
};

function App() {
  const location = useLocation();
  const activePath = location.pathname;

  const [appData,   setAppData]           = useState(INITIAL_APP_DATA);
  const [nodesData, setNodesData] = useState({
    t104: { temperature: 0, voltage: 0, loadFactor: 0, alert: "NORMAL" },
    t105: { temperature: 0, voltage: 0, loadFactor: 0, alert: "NORMAL" },
    t106: { temperature: 0, voltage: 0, loadFactor: 0, alert: "NORMAL" }
  });
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [isDarkMode, setIsDarkMode]       = useState(true);
  const [currentTime, setCurrentTime]     = useState(new Date());

  // Centralized state
  const [nodes, setNodes] = useState([
    { id: 't104', location: 'Cooling Tower 2, North Wing',    telemetry: 612, unit: 'kW', health: 'OPTIMAL', status: 'ACTIVE', trend: 'up-fast' },
    { id: 't105', location: 'Sector 7G, Industrial Bay 4',   telemetry: 450, unit: 'kV', health: 'OPTIMAL', status: 'ACTIVE', trend: 'up'      },
    { id: 't106', location: 'Main Generator Room',            telemetry: 588, unit: 'kV', health: 'OPTIMAL', status: 'ACTIVE', trend: 'down'    },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, title: 'Network initialized',  time: 'Just now', type: 'system' },
  ]);

  const [showProfile,       setShowProfile]       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [awsStatus,         setAwsStatus]         = useState('DISCONNECTED');
  const [toasts,            setToasts]            = useState([]);

  // ─── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Derived application data for AnalyticsView based on current nodesData
  const nodeCount = Object.keys(nodesData).length || 1;
  const appDataMemo = Object.values(nodesData).reduce((acc, curr) => {
    if (!curr) return acc;
    acc.meanOilTemp  += (parseFloat(curr.temperature) || 0) / nodeCount;
    acc.loadFactor   += (parseFloat(curr.loadFactor)  || 0);
    acc.peakVoltage   = Math.max(acc.peakVoltage, parseFloat(curr.voltage) || 0);
    acc.avgHealth    += (curr.healthScore || 0) / nodeCount;
    if (curr.isAnomaly) acc.anomalyCount += 1;
    return acc;
  }, { meanOilTemp: 0, loadFactor: 0, peakVoltage: 0, avgHealth: 0, anomalyCount: 0 });

  const finalAppData = {
    ...appData,
    ...appDataMemo
  };

  const nodesDataRef = useRef(nodesData);
  useEffect(() => {
    nodesDataRef.current = nodesData;
  }, [nodesData]);

  // Periodic chart update — always runs, uses ref for fresh data
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAppData(app => {
        const currentNodes = nodesDataRef.current;
        const totalLoadFactor = Object.values(currentNodes).reduce((sum, n) => sum + (parseFloat(n.loadFactor) || 0), 0);
        const newTrend = [...app.trendData];
        newTrend.shift();
        newTrend.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          phaseA: parseFloat(currentNodes['t104']?.voltage) || 0,
          phaseB: parseFloat(currentNodes['t105']?.voltage) || 0,
          phaseC: parseFloat(currentNodes['t106']?.voltage) || 0,
          value: totalLoadFactor
        });
        return { ...app, trendData: newTrend };
      });
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  // ─── Activity log helper ────────────────────────────────────────────────────
  const addActivity = useCallback((title, type = 'info') => {
    setActivities(prev => [
      { id: Date.now(), title, time: 'Just now', type },
      ...prev.slice(0, 9),
    ]);
  }, []);

  const addToast = useCallback((title, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // ─── Alert tracker ref: tracks last-seen alert per node to prevent dedup locks ─
  const alertTrackerRef = useRef({});

  // ─── Health history refs (useRef to avoid re-render loops) ─────────────────
  // Stores rolling array of up to 20 smoothed healthScore values per node
  const healthHistoryRef = useRef({});
  // Tracks previous anomaly state per node for notification deduplication
  const anomalyStateRef  = useRef({});

  // ─── AWS IoT connection & Polling ─────────────────────────────────────────────
  useEffect(() => {
    let mockInterval = null;
    const liveNodes = new Set();
    const MOCK_NODES = ['t104', 't105', 't106'];

    const startMock = () => {
      if (mockInterval) return;
      mockInterval = setInterval(() => {
        MOCK_NODES.forEach(nodeId => {
          if (liveNodes.has(nodeId)) return;

          const tempAvg = 40 + Math.random() * 60;
          const voltAvg = 210 + Math.random() * 25;
          const loadAvg = 0.5 + Math.random() * 0.5;

          const generateSubNode = (id, label) => ({
            id, label,
            temperature: tempAvg + (Math.random() * 10 - 5),
            voltage: voltAvg + (Math.random() * 10 - 5),
            current: 150 + Math.random() * 200,
            loadFactor: Math.min(1, Math.max(0, loadAvg + (Math.random() * 0.2 - 0.1))),
            signal: 50 + Math.random() * 50,
          });

          const subNodes = [
            generateSubNode('A', 'Phase-A'),
            generateSubNode('B', 'Phase-B'),
            generateSubNode('C', 'Phase-C'),
          ];

          handleData({
            nodeId,
            temperature: tempAvg,
            voltage:     voltAvg,
            loadFactor:  loadAvg,
            current:     150 + Math.random() * 200,
            signal:      50  + Math.random() * 50,
            subNodes,
          });
        });
      }, 2000);
    };

    const stopMock = () => {
      if (mockInterval) { clearInterval(mockInterval); mockInterval = null; }
    };

    const handleData = (data) => {
      if (!data?.nodeId) return;

      if (MOCK_NODES.includes(data.nodeId)) liveNodes.add(data.nodeId);

      const tempAvg = parseFloat(data.temperature) || 0;
      const voltAvg = parseFloat(data.voltage)     || 0;
      const loadAvg = parseFloat(data.loadFactor)  || 0;

      // ── Determine active alerts ────────────────────────────────────────────────
      const alertParts = [];
      if (tempAvg >= 85)        alertParts.push('CRITICAL_TEMP');
      else if (tempAvg >= 75)   alertParts.push('HIGH_TEMP');
      if (voltAvg < 210)        alertParts.push('UNDER_VOLTAGE');
      else if (voltAvg > 235)   alertParts.push('HIGH_VOLTAGE');

      let loadStatus = 'NORMAL';
      if      (loadAvg >= 0.85) loadStatus = 'CRITICAL';
      else if (loadAvg >= 0.75) loadStatus = 'HIGH';
      else if (loadAvg >= 0.65) loadStatus = 'MODERATE';

      const activeAlert = alertParts.length > 0 ? alertParts.join(', ') : 'NORMAL';

      // ── Health scoring ─────────────────────────────────────────────────────────
      const computeHealth = (d) => {
        if (!d) return 0;
        const tmp = parseFloat(d.temperature) || 0;
        const vlt = parseFloat(d.voltage)     || 0;
        const ldf = parseFloat(d.loadFactor)  || 0;
        const tempScore    = Math.min(Math.max((tmp - 60) / 25, 0), 1);
        const voltageScore = Math.min(Math.max(Math.abs(vlt - 220) / 20, 0), 1);
        const loadScore    = Math.min(Math.max((ldf - 0.5) / 0.35, 0), 1);
        return Number(Math.min(tempScore * 0.4 + voltageScore * 0.3 + loadScore * 0.3, 0.88).toFixed(3));
      };

      const subScores    = (data.subNodes || []).map(computeHealth);
      const avgSubHealth = subScores.length > 0 ? subScores.reduce((a, b) => a + b, 0) / subScores.length : 0;
      const mainHealth   = computeHealth(data);
      const newScore     = subScores.length > 0 ? (mainHealth * 0.5) + (avgSubHealth * 0.5) : mainHealth;

      // Read fresh data from ref
      const prevNode          = nodesDataRef.current[data.nodeId] || {};
      const prevHealthScore   = typeof prevNode.healthScore === 'number' ? prevNode.healthScore : 0;
      const smoothedScore     = Number(((prevHealthScore * 0.7) + (newScore * 0.3)).toFixed(4));
      const safeSmoothed      = isNaN(smoothedScore) ? 0 : smoothedScore;

      let status = 'HEALTHY';
      if      (safeSmoothed >= 0.88) status = 'CRITICAL';
      else if (safeSmoothed >= 0.79) status = 'WARNING';

      // ── Rolling health history (stored in ref, max 20 entries) ─────────────────
      if (!healthHistoryRef.current[data.nodeId]) {
        healthHistoryRef.current[data.nodeId] = [];
      }
      const nodeHistory = healthHistoryRef.current[data.nodeId];
      nodeHistory.push(safeSmoothed);
      if (nodeHistory.length > 20) nodeHistory.shift();
      // Safe snapshot copy for state (plain array, no circular refs)
      const historySnapshot = [...nodeHistory];

      // ── Anomaly detection ──────────────────────────────────────────────────────
      const { isAnomaly, anomalyReason } = detectAnomaly(nodeHistory, safeSmoothed);

      // ── Anomaly notification — fire only on false → true transition ────────────
      const prevIsAnomaly = anomalyStateRef.current[data.nodeId] ?? false;
      if (isAnomaly && !prevIsAnomaly) {
        anomalyStateRef.current[data.nodeId] = true;
        addToast(`AI Alert: Node ${data.nodeId} shows unusual health trend`, 'anomaly');
        addActivity(`AI Anomaly on ${data.nodeId}: ${anomalyReason}`, 'warning');
        if (Notification.permission === 'granted') {
          try {
            new Notification(`AI Alert: Node ${data.nodeId}`, {
              body: `${anomalyReason}`,
            });
          } catch (_) {}
        }
      } else if (!isAnomaly) {
        anomalyStateRef.current[data.nodeId] = false;
      }

      const prevSubHealth = prevNode.subNodeHealth || { A: { healthScore: 0 }, B: { healthScore: 0 }, C: { healthScore: 0 } };
      const smoothSub = (prevS, currS) => {
        const s = (prevS * 0.7) + ((typeof currS === 'number' && !isNaN(currS) ? currS : 0) * 0.3);
        return isNaN(s) ? 0 : Number(s.toFixed(4));
      };

      // ── Update node data ───────────────────────────────────────────────────────
      setNodesData(prev => ({
        ...prev,
        [data.nodeId]: {
          ...(prev[data.nodeId] || {}),
          location:      data.location ?? prev[data.nodeId]?.location ?? 'Unknown',
          temperature:   tempAvg,
          voltage:       voltAvg,
          loadFactor:    loadAvg,
          current:       parseFloat(data.current) || prev[data.nodeId]?.current || 0,
          signal:        parseFloat(data.signal)  || prev[data.nodeId]?.signal  || 95,
          healthScore:   safeSmoothed,
          status,
          loadStatus,
          isAnomaly,
          anomalyReason,
          healthHistory: historySnapshot,
          subNodeHealth: {
            A: { ...(data.subNodes?.[0] || {}), healthScore: smoothSub(prevSubHealth.A?.healthScore ?? 0, subScores[0]) },
            B: { ...(data.subNodes?.[1] || {}), healthScore: smoothSub(prevSubHealth.B?.healthScore ?? 0, subScores[1]) },
            C: { ...(data.subNodes?.[2] || {}), healthScore: smoothSub(prevSubHealth.C?.healthScore ?? 0, subScores[2]) },
          },
          alert: activeAlert,
        },
      }));

      // ── Live alert stream — time-window dedup (5 s per node+alert combo) ───────
      const alertKey = `${data.nodeId}::${activeAlert}::${status}`;
      const now = Date.now();
      const lastSeen = alertTrackerRef.current[alertKey] || 0;
      const isNonNormal = activeAlert !== 'NORMAL' || status === 'WARNING' || status === 'CRITICAL';

      if (isNonNormal && (now - lastSeen > 5000)) {
        alertTrackerRef.current[alertKey] = now;

        const alertToLog = (status === 'WARNING' || status === 'CRITICAL')
          ? `Status: ${status} | ${activeAlert}`
          : activeAlert;

        setLiveAlerts(prev => {
          const newAlert = {
            id:     now + Math.random(),
            nodeId: data.nodeId,
            alert:  alertToLog,
            time:   new Date().toLocaleTimeString(),
          };
          return [newAlert, ...prev].slice(0, 20);
        });

        addToast(`[${data.nodeId}] ${alertToLog}`, 'warning');
        addActivity(`Alert from ${data.nodeId}: ${alertToLog}`, 'warning');

        // Browser notification
        if (Notification.permission === 'granted') {
          try {
            new Notification(`Alert: ${data.nodeId}`, {
              body: `Node ${data.nodeId}: ${alertToLog}`,
            });
          } catch (_) {}
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    };

    const connection = connectAWS(
      handleData,
      (connStatus) => {
        setAwsStatus(connStatus);
        if (connStatus === 'CONNECTED') {
          addActivity('Secure Link Established with AWS IoT Core', 'system');
        } else if (connStatus === 'DISCONNECTED') {
          addActivity('MQTT Connection Closed', 'warning');
          liveNodes.clear();
        }
      }
    );

    startMock();

    return () => {
      if (connection?.disconnect) connection.disconnect();
      stopMock();
    };
  }, [addActivity, addToast]);

  // ─── Node helpers ───────────────────────────────────────────────────────────
  const addNode = useCallback((newNode) => {
    setNodes(prev => [...prev, newNode]);
    addActivity(`Node ${newNode.id} added to network`, 'info');
  }, [addActivity]);

  const removeNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    addActivity(`Node ${nodeId} removed from network`, 'warning');
  }, [addActivity]);

  // ─── Utilities ──────────────────────────────────────────────────────────────
  const exportCSV = useCallback((data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows    = data.map(obj => Object.values(obj).join(',')).join('\n');
    const blob    = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const link    = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    addActivity(`Exported ${filename} data to CSV`, 'info');
  }, [addActivity]);

  const generateFullReport = useCallback((view) => {
    const reportContent = `
XMERION INDUSTRIAL INTELLIGENCE - FULL REPORT
--------------------------------------------
Report Type: ${view.toUpperCase()} SUMMARY
Generated: ${new Date().toLocaleString()}
Operator: Alex Chen
AWS Status: ${awsStatus}

SYSTEM STATUS: NOMINAL
ACTIVE NODES: ${nodes.filter(n => n.status === 'ACTIVE').length}
    `;
    const blob    = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link    = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `Xmerion_Report_${view}_${Date.now()}.txt`;
    link.click();
    addActivity(`Generated full report for ${view}`, 'system');
  }, [awsStatus, nodes, addActivity]);

  // View state helpers for Header
  const isNodesPage = activePath === '/';
  const isAwsPage = activePath === '/aws';
  const isDashboardPage = activePath.startsWith('/node/');

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ marginBottom: '1.5rem' }}>
          <div className="sidebar-logo" style={{ backgroundImage: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)', padding: '6px' }}>
            <Network size={22} color="white" strokeWidth={2.5} />
          </div>
          <div className="sidebar-title">
            <h1 style={{ fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Xmerion</h1>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Industrial<br />Intelligence</span>
          </div>
        </div>

        <nav className="nav-menu">
          <Link to="/" className={`nav-item ${activePath === '/' ? 'active' : ''}`}>
            <Network size={20} /> Nodes Summary
          </Link>
          <Link to="/node/t104" className={`nav-item ${activePath === '/node/t104' ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Node t104
          </Link>
          <Link to="/node/t105" className={`nav-item ${activePath === '/node/t105' ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Node t105
          </Link>
          <Link to="/node/t106" className={`nav-item ${activePath === '/node/t106' ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Node t106
          </Link>
          <Link to="/analytics" className={`nav-item ${activePath === '/analytics' ? 'active' : ''}`}>
            <BarChart3 size={20} /> Analytics
          </Link>
          <Link to="/aws" className={`nav-item ${activePath === '/aws' ? 'active' : ''}`}>
            <Cloud size={20} /> AWS IoT
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" style={{ marginBottom: '1.5rem', width: '100%' }}>
            <Settings size={20} /> Settings
          </button>
          <div className="user-profile" onClick={() => setShowProfile(!showProfile)} style={{ cursor: 'pointer', position: 'relative' }}>
            <div className="user-avatar">
              <img src="https://i.pravatar.cc/150?u=a04258a2462d826712d" alt="Alex Chen" />
            </div>
            <div className="user-info">
              <span className="name">Alex Chen</span>
              <span className="role">Chief Operator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        <header
          className="top-header"
          style={{
            padding: '0 2rem',
            borderBottom:      (isNodesPage || isDashboardPage || isAwsPage) ? 'none' : '1px solid var(--panel-border)',
            backgroundColor:   (isNodesPage || isDashboardPage || isAwsPage) ? 'transparent' : 'var(--header-bg)',
          }}
        >
          <div className="header-left">
            {isNodesPage ? (
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                Nodes <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Management</span>
              </h2>
            ) : isDashboardPage ? (
              <h2 style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, letterSpacing: '0.5px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>REGION // SECTOR 07 &gt;</span>{' '}
                <span style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>Transformer Unit {activePath.split('/').pop()}</span>
              </h2>
            ) : isAwsPage ? (
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                AWS IoT <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Integration</span>
              </h2>
            ) : (
              <>
                <div className="header-title">XMERION</div>
                <div className="header-subtitle">Transformer Analytics</div>
              </>
            )}
          </div>

          <div className="header-right">
            {!isDashboardPage && !isNodesPage && !isAwsPage && (
              <div className="header-datetime">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }}></span>
                  Live
                </span>
                {new Intl.DateTimeFormat('en-US', {
                  timeZone: 'Asia/Kolkata',
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: true,
                }).format(currentTime).replace(/, (\d{1,2}:\d{2})/, ' - $1')}
              </div>
            )}
            <div className="header-actions">
              {awsStatus === 'CONNECTED' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <Cloud size={14} /> CLOUD SYNC ACTIVE
                </div>
              )}
              <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <div style={{ position: 'relative' }}>
                <button className={`icon-btn ${activities.length > 0 ? 'has-notification' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={20} />
                </button>
                {showNotifications && (
                  <div className="panel-card" style={{ position: 'absolute', top: '100%', right: 0, width: '300px', marginTop: '0.5rem', padding: '1rem', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      Notifications
                      <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.7rem' }} onClick={() => setActivities([])}>Clear all</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                      {activities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No new notifications</div>
                      ) : (
                        activities.map((activity) => (
                          <div key={activity.id} style={{ borderLeft: `2px solid ${activity.type === 'warning' ? 'var(--accent-red)' : 'var(--accent-blue)'}`, paddingLeft: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{activity.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{activity.time}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="content-area" style={{ paddingTop: (isNodesPage || isDashboardPage || isAwsPage) ? '0' : '2rem' }}>
          <Routes>
            <Route path="/" element={<NodesView nodesData={nodesData} liveAlerts={liveAlerts} />} />
            <Route path="/node/:id" element={<NodePage nodesData={nodesData} awsStatus={awsStatus} />} />
            <Route path="/analytics" element={<AnalyticsView data={finalAppData} onExportCSV={(data, name) => exportCSV(data, name)} onFullReport={() => generateFullReport('analytics')} awsStatus={awsStatus} />} />
            <Route path="/aws" element={<AWSIoTView awsStatus={awsStatus} setAwsStatus={setAwsStatus} appData={finalAppData} />} />
          </Routes>
        </div>

        {/* Toast Notifications container */}
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 9999 }}>
          {toasts.map(toast => (
            <div key={toast.id} className={`panel-card toast-enter${toast.type === 'anomaly' ? ' toast-anomaly' : ''}`} style={{
               minWidth: '250px', padding: '1.25rem',
               backgroundColor: 'var(--panel-bg)',
               border: '1px solid var(--panel-border)',
               borderLeft: `4px solid ${
                 toast.type === 'anomaly'  ? 'var(--accent-purple)' :
                 toast.type === 'warning'  ? 'var(--accent-red)'    :
                 'var(--status-optimal)'
               }`,
               boxShadow: toast.type === 'anomaly'
                 ? '0 8px 32px rgba(168,85,247,0.25)'
                 : '0 8px 32px rgba(0,0,0,0.4)',
               animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {toast.type === 'anomaly' ? '🤖 AI ANOMALY ALERT' : toast.type === 'warning' ? '🚨 CRITICAL ALERT' : 'ℹ️ SYSTEM MESSAGE'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                {toast.title}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
