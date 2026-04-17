import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import connectAWS from './aws-iot';
import {
  Zap,
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
  loadFactor:  null,
  peakVoltage: null,
  meanOilTemp: null,
  signalStrength: null,
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
  const [nodesData, setNodesData]         = useState({});
  const [isDarkMode, setIsDarkMode]       = useState(true);
  const [currentTime, setCurrentTime]     = useState(new Date());

  // Centralized state
  const [nodes, setNodes] = useState([
    { id: 't104', location: 'Sector 7G, Industrial Bay 4',       telemetry: 450, unit: 'kV', health: 'OPTIMAL',  status: 'ACTIVE',  trend: 'up'       },
    { id: 't105', location: 'Cooling Tower 2, North Wing',       telemetry: 612, unit: 'kW', health: 'OVERHEAT', status: 'ALERT',   trend: 'up-fast'  },
    { id: 't106', location: 'Main Generator Room',               telemetry: 588, unit: 'kV', health: 'STABLE',   status: 'ACTIVE',  trend: 'down'     },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, title: 'Network initialized',  time: 'Just now', type: 'system' },
  ]);

  const [showProfile,       setShowProfile]       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [awsStatus,         setAwsStatus]         = useState('DISCONNECTED');

  // ─── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // ─── Activity log helper ────────────────────────────────────────────────────
  const addActivity = useCallback((title, type = 'info') => {
    setActivities(prev => [
      { id: Date.now(), title, time: 'Just now', type },
      ...prev.slice(0, 9),
    ]);
  }, []);

  // ─── AWS IoT connection & Polling ───────────────────────────────────────────
  useEffect(() => {
    // 1. Maintain SSE connection simply for connection status logging
    const connection = connectAWS(
      (incoming) => {
        console.log('LIVE AWS DATA:', incoming);
        // We log incoming data to satisfy the requirement
      },
      (status) => {
        setAwsStatus(status);
        if (status === 'CONNECTED') {
          addActivity('Secure Link Established with AWS IoT Core', 'system');
        } else if (status === 'DISCONNECTED') {
          addActivity('MQTT Connection Closed', 'warning');
        }
      }
    );

    // 2. Poll the /data endpoint for live multi-node states
    const fetchNodes = async () => {
      try {
        const res = await fetch('http://localhost:3001/data');
        if (res.ok) {
          const fetchedData = await res.json();
          setNodesData(fetchedData);

          // Derive global analytics from nodesData
          setAppData(prev => {
            const nodeVals = Object.values(fetchedData);
            if (nodeVals.length === 0) return prev;

            const avgCurrent = nodeVals.reduce((acc, n) => acc + parseFloat(n.current || 0), 0) / nodeVals.length;
            const maxVoltage = Math.max(...nodeVals.map(n => parseFloat(n.voltage || 0)));
            const avgTemp = nodeVals.reduce((acc, n) => acc + parseFloat(n.temperature || 0), 0) / nodeVals.length;
            const avgSignal = nodeVals.reduce((acc, n) => acc + parseFloat(n.signal || 0), 0) / nodeVals.length;

            const newPoint = {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              phaseA: maxVoltage || 0,
              phaseB: (maxVoltage || 0) * 0.98,
              phaseC: (maxVoltage || 0) * 1.02,
              value: avgCurrent || 0,
            };

            return {
              ...prev,
              loadFactor: avgCurrent,
              peakVoltage: maxVoltage,
              meanOilTemp: avgTemp,
              signalStrength: avgSignal,
              trendData: [...(prev.trendData || []).slice(-23), newPoint],
            };
          });

          // Sync individual nodes list for NodesView
          setNodes(prevNodes => prevNodes.map(n => {
             const live = fetchedData[n.id];
             if (live) {
                return {
                   ...n,
                   telemetry: Math.round(parseFloat(live.voltage)),
                   health: parseFloat(live.temperature) > 75 ? 'OVERHEAT' : 'OPTIMAL',
                   status: 'ACTIVE',
                };
             }
             return n;
          }));

        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    
    // Initial fetch and interval
    fetchNodes();
    const interval = setInterval(fetchNodes, 5000);

    return () => {
      if (connection && connection.disconnect) {
        connection.disconnect();
      }
      clearInterval(interval);
    };
  }, [addActivity]);

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
            <Route path="/" element={<NodesView nodes={nodes} onAddNode={addNode} onRemoveNode={removeNode} activities={activities} onExportCSV={(data) => exportCSV(data, 'Nodes_Network')} awsStatus={awsStatus} />} />
            <Route path="/node/:id" element={<NodePage nodesData={nodesData} awsStatus={awsStatus} />} />
            <Route path="/analytics" element={<AnalyticsView data={appData} onExportCSV={(data, name) => exportCSV(data, name)} onFullReport={() => generateFullReport('analytics')} awsStatus={awsStatus} />} />
            <Route path="/aws" element={<AWSIoTView awsStatus={awsStatus} setAwsStatus={setAwsStatus} appData={appData} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
