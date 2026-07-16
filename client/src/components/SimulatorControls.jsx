import React, { useState, useEffect } from 'react';
import { Play, Coffee, LogOut, Shield, Users } from 'lucide-react';

const STATE_META = {
  PRE_MATCH: { label: 'Pre-Match Arrival', icon: Users, desc: 'Gates & Concourses filling' },
  FIRST_HALF: { label: 'First Half In-Play', icon: Shield, desc: 'Packed seating sections' },
  HALFTIME: { label: 'Halftime Rush', icon: Coffee, desc: 'Concourses & food courts spike' },
  SECOND_HALF: { label: 'Second Half In-Play', icon: Play, desc: 'Fans back in sections' },
  POST_MATCH: { label: 'Post-Match Exit', icon: LogOut, desc: 'Gates & exit corridors flood' }
};

export default function SimulatorControls({ activeState, onChangeState }) {
  const [loading, setLoading] = useState(false);

  const handleStateChange = async (stateKey) => {
    if (stateKey === activeState) return;
    setLoading(true);
    try {
      await onChangeState(stateKey);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel sim-controls-panel">
      <div className="zone-header">
        <h3 className="panel-title" style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
          <Play size={18} style={{ color: 'var(--color-primary)' }} />
          Simulation Control Panel
        </h3>
        <span className="zone-category" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
          Active Cycle
        </span>
      </div>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Select a phase to simulate crowd flow transitions across stadium gates, concourses, and seating:
      </p>

      <div className="sim-state-grid">
        {Object.entries(STATE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const isActive = activeState === key;
          return (
            <button
              key={key}
              onClick={() => handleStateChange(key)}
              disabled={loading}
              className={`sim-state-btn ${isActive ? 'active' : ''}`}
              title={meta.desc}
            >
              <Icon size={20} style={{ marginBottom: '4px' }} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
