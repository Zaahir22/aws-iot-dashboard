import React, { useState, useMemo } from 'react';
import { Cloud, Lock, Server, Activity, ArrowRightLeft, Radio, Key, RefreshCcw, WifiOff, Wifi, CheckCircle, AlertCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis } from 'recharts';

const AWSIoTView = ({ awsStatus, setAwsStatus, appData }) => {
  const [isProvisioned, setIsProvisioned] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isSyncingShadow, setIsSyncingShadow] = useState(false);
  const [shadowOutOfSync, setShadowOutOfSync] = useState(true);
  
  // Connect chart to global telemetry data
  const telemetryData = useMemo(() => {
    return appData?.trendData || Array.from({ length: 20 }).map((_, i) => ({ time: i, value: 0 }));
  }, [appData]);

  const handleConnect = () => {
    if (awsStatus === 'CONNECTED') {
      setAwsStatus('DISCONNECTED');
    } else {
      setAwsStatus('CONNECTING'); // This will trigger the connection in App.jsx if we change it there, or we can just let App.jsx handle it since it connects on mount.
      // Actually, currently App.jsx connects on mount and AWSIoTView just sets the status which might be overwritten by the real connection.
    }
  };

  const handleProvision = () => {
    setIsProvisioning(true);
    setTimeout(() => {
      setIsProvisioning(false);
      setIsProvisioned(true);
    }, 3000);
  };

  const handleSyncShadow = () => {
    setIsSyncingShadow(true);
    setTimeout(() => {
      setIsSyncingShadow(false);
      setShadowOutOfSync(false);
    }, 1500);
  };

  return (
    <div className="aws-iot-view" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

      {/* Top Welcome / Status Header */}
      <div className="panel-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 58, 138, 0.05) 100%)', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Cloud size={28} color={awsStatus === 'CONNECTED' ? '#10b981' : '#60a5fa'} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>AWS IoT Core Integration</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: '1.5' }}>
            Live bi-directional MQTT telemetry, Device Shadow synchronization, and X.509 certificate provisioning for industrial-grade cloud connectivity.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <span style={{ 
               fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', 
               color: awsStatus === 'CONNECTED' ? '#10b981' : awsStatus === 'CONNECTING' ? '#fbbf24' : '#fca5a5', 
               backgroundColor: awsStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.1)' : awsStatus === 'CONNECTING' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
               padding: '0.35rem 0.75rem', borderRadius: '1rem', border: `1px solid ${awsStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.3)' : awsStatus === 'CONNECTING' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
               display: 'flex', alignItems: 'center', gap: '0.5rem' 
             }}>
               {awsStatus === 'CONNECTED' ? <Wifi size={14} /> : awsStatus === 'CONNECTING' ? <RefreshCcw size={14} className="spin" /> : <WifiOff size={14} />}
               {awsStatus}
             </span>
             <button 
               onClick={handleConnect}
               className={awsStatus === 'CONNECTED' ? 'btn-outline' : 'btn-primary'}
               style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}
             >
               {awsStatus === 'CONNECTED' ? 'DISCONNECT' : awsStatus === 'CONNECTING' ? 'CANCEL' : 'ESTABLISH LINK'}
             </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Endpoint: ajn6olmvk0maf-ats.iot.ap-south-1.amazonaws.com</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1 }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Certificate Provisioning */}
          <div className="panel-card" style={{ padding: '1.5rem', flex: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Key size={18} color="#93c5fd" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Security & Authentication</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>X.509 Device Certificate</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {isProvisioned ? 'active-cert-v1.crt' : 'Awaiting initial provisioning'}
                  </div>
                </div>
                {isProvisioned ? <CheckCircle size={16} color="#10b981" /> : <Lock size={16} color="var(--text-muted)" />}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Root CA Certificate</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Amazon Root CA 1 / 3</div>
                </div>
                <Server size={16} color="#10b981" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Device Policy</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Restrictive Pub/Sub Permissions</div>
                </div>
                {isProvisioned ? <CheckCircle size={16} color="#10b981" /> : <Lock size={16} color="var(--text-muted)" />}
              </div>
            </div>

            <button 
              onClick={handleProvision}
              disabled={isProvisioned || isProvisioning}
              style={{ 
                marginTop: '1.5rem', width: '100%', 
                backgroundColor: isProvisioned ? 'rgba(16, 185, 129, 0.1)' : 'var(--panel-bg-hover)', 
                color: isProvisioned ? '#10b981' : 'var(--text-secondary)', 
                border: isProvisioned ? '1px solid rgba(16, 185, 129, 0.3)' : '1px dashed var(--panel-border)', 
                padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, 
                cursor: (isProvisioned || isProvisioning) ? 'default' : 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' 
              }}>
              {isProvisioning ? (
                <><RefreshCcw size={14} className="spin" /> PROVISIONING...</>
              ) : isProvisioned ? (
                <><CheckCircle size={14} /> DEVICE PROVISIONED</>
              ) : (
                <><RefreshCcw size={14} /> PROVISION DEVICE</>
              )}
            </button>
          </div>

          {/* MQTT Telemetry Stream Sync */}
          <div className="panel-card" style={{ padding: '1.5rem', flex: '1', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Radio size={18} color="#93c5fd" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>MQTT Telemetry Pipeline</h3>
              </div>
              <div 
                className={awsStatus === 'CONNECTED' ? 'status-badge status-optimal' : 'status-badge status-offline'}
                style={{ border: '1px solid var(--panel-border)' }}
              >
                {awsStatus === 'CONNECTED' ? 'STREAMING' : 'IDLE'}
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Subscribe:</p>
                <div style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.7rem' }}>dt/xmerion/t104/metrics</div>
              </div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Publish:</p>
                <div style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '0.7rem' }}>cmd/xmerion/t104/exec</div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', opacity: awsStatus === 'CONNECTED' ? 0.4 : 0.1 }}>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={telemetryData}>
                  <defs>
                    <linearGradient id="cloudColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="phaseA" stroke="#3b82f6" strokeWidth={2} fill="url(#cloudColor)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Device Shadow */}
          <div className="panel-card" style={{ padding: '1.5rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft size={18} color="#93c5fd" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Device Shadow Status</h3>
              </div>
              <span className={shadowOutOfSync ? 'status-badge status-overheat' : 'status-badge status-optimal'}>
                {shadowOutOfSync ? 'OUT OF SYNC' : 'SYNCHRONIZED'}
              </span>
            </div>

            <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--panel-border)', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-primary)', overflowY: 'auto' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>// {shadowOutOfSync ? 'Shadow Delta detected' : 'States matching'}</div>
              <div>{`{`}</div>
              <div style={{ paddingLeft: '1rem' }}>{`"state": {`}</div>
              <div style={{ paddingLeft: '2rem' }}>{`"reported": {`}</div>
              <div style={{ paddingLeft: '3rem', color: 'var(--accent-blue)' }}>{`"operationMode": "AUTO",`}</div>
              <div style={{ paddingLeft: '3rem', color: 'var(--accent-blue)' }}>{`"diagnosticRate": "${shadowOutOfSync ? '60s' : '15s'}"`}</div>
              <div style={{ paddingLeft: '2rem' }}>{`},`}</div>
              <div style={{ paddingLeft: '2rem' }}>{`"desired": {`}</div>
              <div style={{ paddingLeft: '3rem', color: shadowOutOfSync ? 'var(--accent-red)' : 'var(--accent-blue)' }}>{`"diagnosticRate": "15s"${shadowOutOfSync ? ' // DELTA' : ''}`}</div>
              <div style={{ paddingLeft: '2rem' }}>{`}`}</div>
              <div style={{ paddingLeft: '1rem' }}>{`}`}</div>
              <div>{`}`}</div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={14} /> Resolves desired state changes locally when connectivity resumes.
              </div>
              <button 
                onClick={handleSyncShadow}
                disabled={!shadowOutOfSync || isSyncingShadow || awsStatus !== 'CONNECTED'}
                className="btn-primary"
                style={{ width: '100%', opacity: (!shadowOutOfSync || awsStatus !== 'CONNECTED') ? 0.5 : 1, cursor: (!shadowOutOfSync || awsStatus !== 'CONNECTED') ? 'not-allowed' : 'pointer' }}
              >
                {isSyncingShadow ? <><RefreshCcw size={14} className="spin" /> SYNCING...</> : 'RESOLVE DELTA'}
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AWSIoTView;
