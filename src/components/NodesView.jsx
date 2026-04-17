import React, { useState } from 'react';
import { Plus, PowerOff, AlertTriangle, Zap, X } from 'lucide-react';

const NodesView = ({ nodes, onAddNode, onRemoveNode, onExportCSV, activities, awsStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    location: '',
    telemetry: '',
    status: 'ACTIVE'
  });

  const totalNodes = nodes.length;
  const activeNodes = nodes.filter(n => n.status === 'ACTIVE').length;
  const warningNodes = nodes.filter(n => n.health === 'OVERHEAT').length;
  const uptimePercent = totalNodes > 0 ? Math.round((activeNodes / totalNodes) * 100) : 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.telemetry) return;

    const newNode = {
      id: formData.id,
      location: formData.location || 'Unknown Location',
      telemetry: parseInt(formData.telemetry),
      unit: 'kV',
      health: parseInt(formData.telemetry) > 600 ? 'OVERHEAT' : 'OPTIMAL',
      status: formData.status,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };

    onAddNode(newNode);
    setIsModalOpen(false);
    setFormData({ id: '', location: '', telemetry: '', status: 'ACTIVE' });
  };

  return (
    <div className="nodes-view" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      
      {/* Add Node Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="panel-card" style={{ 
            width: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Provision New Node</h3>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NODE IDENTITY</label>
                <input 
                  type="text" name="id" value={formData.id} onChange={handleInputChange}
                  placeholder="e.g. TR-9902-X" required
                  style={{ backgroundColor: 'var(--panel-bg-hover)', border: '1px solid var(--panel-border)', padding: '0.75rem', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>LOCATION</label>
                <input 
                  type="text" name="location" value={formData.location} onChange={handleInputChange}
                  placeholder="e.g. Sector 7G, Bay 4"
                  style={{ backgroundColor: 'var(--panel-bg-hover)', border: '1px solid var(--panel-border)', padding: '0.75rem', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TELEMETRY (kV)</label>
                <input 
                  type="number" name="telemetry" value={formData.telemetry} onChange={handleInputChange}
                  placeholder="Current value" required
                  style={{ backgroundColor: 'var(--panel-bg-hover)', border: '1px solid var(--panel-border)', padding: '0.75rem', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>INITIAL STATUS</label>
                <select 
                  name="status" value={formData.status} onChange={handleInputChange}
                  style={{ backgroundColor: 'var(--panel-bg-hover)', border: '1px solid var(--panel-border)', padding: '0.75rem', borderRadius: '4px', color: 'var(--text-primary)' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="STANDBY">STANDBY</option>
                  <option value="ALERT">ALERT</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                ADD NODE TO NETWORK
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.25rem' }}>
        <div className="panel-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL NODES</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--text-primary)' }}>{totalNodes}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>UNIT-A</span>
          </div>
        </div>
        
        <div className="panel-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }}></div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>ACTIVE NODES</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--text-primary)' }}>{activeNodes}</span>
            <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600 }}>{uptimePercent}% UP</span>
          </div>
        </div>

        <div className="panel-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
           <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--status-overheat)' }}></div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>NODES IN WARNING</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--status-overheat)' }}>{warningNodes}</span>
            <span style={{ color: 'var(--status-overheat)', fontSize: '0.8rem', fontWeight: 600 }}>CRITICAL</span>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)', 
            border: 'none', borderRadius: 'var(--radius-lg)', color: 'white',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            gap: '0.5rem', cursor: 'pointer', transition: 'filter 0.2s', padding: '1rem'
          }} className="table-row-hover">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} strokeWidth={2} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.5px' }}>ADD NEW NODE</span>
        </button>
      </div>

      {/* Network List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 500, display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          Transformer Network <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 400 }}>Active Session: 2.4.0</span>
          {awsStatus === 'CONNECTED' && (
            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Zap size={14} fill="#10b981" /> CLOUD LINK ACTIVE
            </span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ backgroundColor: 'var(--panel-bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>FILTER</button>
          <button onClick={() => onExportCSV(nodes)} style={{ backgroundColor: 'var(--panel-bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>EXPORT CSV</button>
        </div>
      </div>

      {/* Network List Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', padding: '0 1.5rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
          <div>NODE IDENTITY & LOCATION</div>
          <div>TELEMETRY</div>
          <div>HEALTH</div>
          <div>STATUS</div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>

        {nodes.map((node) => (
          <div key={node.id} className="panel-card" style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', alignItems: 'center', borderRadius: 'var(--radius-md)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: 40, height: 40, backgroundColor: 'var(--panel-bg-hover)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {node.health === 'OVERHEAT' ? <AlertTriangle size={20} color="#fca5a5"/> : node.health === 'OFFLINE' ? <PowerOff size={20} color="var(--text-muted)"/> : <Zap size={20} color="#93c5fd"/>}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '0.5px' }}>{node.id}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{node.location}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: node.health === 'OVERHEAT' ? '#fca5a5' : node.health === 'OFFLINE' ? 'var(--text-muted)' : '#93c5fd' }}>
                  {node.telemetry === 0 ? '000' : node.telemetry}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> {node.unit}</span>
              </div>
              <svg width="40" height="12" viewBox="0 0 40 12" style={{ opacity: node.health === 'OFFLINE' ? 0.1 : 1 }}>
                <path d={
                    node.trend === 'up' ? "M0,10 Q10,12 20,6 T40,2" :
                    node.trend === 'up-fast' ? "M0,12 Q10,10 20,8 T40,0" :
                    node.trend === 'down' ? "M0,2 Q10,0 20,4 T40,10" :
                    "M0,6 L40,6"
                } fill="none" stroke={node.health === 'OVERHEAT' ? '#fca5a5' : node.health === 'OFFLINE' ? 'var(--text-muted)' : '#93c5fd'} strokeWidth="1.5" />
              </svg>
            </div>

            <div>
              <span style={{ 
                display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px',
                color: node.health === 'OVERHEAT' ? '#fca5a5' : node.health === 'OFFLINE' ? 'var(--text-muted)' : '#93c5fd',
                backgroundColor: node.health === 'OVERHEAT' ? 'rgba(239, 68, 68, 0.1)' : node.health === 'OFFLINE' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${node.health === 'OVERHEAT' ? 'rgba(239, 68, 68, 0.2)' : node.health === 'OFFLINE' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
              }}>
                {node.health}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: node.status === 'ALERT' ? '#f87171' : node.status === 'STANDBY' ? 'var(--text-muted)' : 'var(--text-primary)' }}></div>
              {node.status}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => onRemoveNode(node.id)}
                style={{ color: 'var(--text-secondary)', hover: 'var(--accent-red)', padding: '0.5rem' }}
              >
                <PowerOff size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Display Area */}
      <div style={{ marginTop: '1rem' }}>
        
        {/* Recent Activity */}
        <div className="panel-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>RECENT ACTIVITY</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: 2, backgroundColor: activity.type === 'warning' ? '#f87171' : '#60a5fa', borderRadius: 2 }}></div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{activity.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


export default NodesView;
