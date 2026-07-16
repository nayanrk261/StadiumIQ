import React, { useState } from 'react';
import { Users, AlertTriangle, Info, BellRing } from 'lucide-react';

export default function CrowdHeatmap({ zones, alerts, selectedZoneId, onSelectZone }) {
  if (!zones || zones.length === 0) {
    return (
      <div className="glass-panel heatmap-container" style={{ padding: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', flexDirection: 'column', gap: '12px' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading telemetry zones...</span>
      </div>
    );
  }

  const selectedZone = zones.find(z => z.zoneId === selectedZoneId) || zones[0];
  const zoneAlerts = alerts.filter(a => a.zoneId === selectedZoneId);

  // Helper to resolve density colors
  const getStatusColor = (status, opacity = 1) => {
    switch (status) {
      case 'Danger':
        return `rgba(239, 68, 68, ${opacity})`;
      case 'Warning':
        return `rgba(245, 158, 11, ${opacity})`;
      default:
        return `rgba(16, 185, 129, ${opacity})`;
    }
  };

  const getPercentage = (zone) => {
    if (!zone || !zone.capacity) return 0;
    return Math.min(100, Math.floor((zone.currentCount / zone.capacity) * 100));
  };

  return (
    <div className="grid-2">
      {/* Stadium Heatmap Interactive Map */}
      <div className="glass-panel heatmap-container">
        <div className="zone-header" style={{ marginBottom: '15px' }}>
          <h3 className="panel-title" style={{ margin: 0 }}>
            <Users size={20} style={{ color: 'var(--color-primary)' }} />
            Lusail Digital Twin Heatmap
          </h3>
          <div className="status-badge" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>
            <div className="pulse-glow-dot" style={{ backgroundColor: 'var(--color-normal)' }} />
            Telemetry Live
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Click any zone below to examine current density, capacity, and active AI safety directives.
        </p>

        {/* Custom Stadium SVG Map */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg viewBox="0 0 500 400" className="stadium-svg">
            <defs>
              <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e3a2f" />
                <stop offset="100%" stopColor="#0d231a" />
              </radialGradient>
            </defs>

            {/* Stadium background canvas boundary */}
            <rect width="500" height="400" fill="none" />

            {/* Soccer Pitch Center */}
            <rect x="180" y="150" width="140" height="100" fill="url(#fieldGrad)" stroke="#2d5e49" strokeWidth="2" rx="4" />
            <circle cx="250" cy="200" r="22" fill="none" stroke="#2d5e49" strokeWidth="2" />
            <line x1="250" y1="150" x2="250" y2="250" stroke="#2d5e49" strokeWidth="2" />

            {/* 1. SEATING SECTIONS (Inner Ring) */}
            {/* Sections 101-104 (Top) */}
            <path
              d="M 160,130 L 340,130 L 320,100 L 180,100 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'section-101-104')?.status, 0.45)}
              stroke={selectedZoneId === 'section-101-104' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'section-101-104')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'section-101-104' ? '3' : '1.5'}
              onClick={() => onSelectZone('section-101-104')}
            />
            <text x="250" y="118" textAnchor="middle" fontSize="10">SEC 101-104</text>

            {/* Sections 105-108 (Right) */}
            <path
              d="M 335,140 L 335,260 L 365,280 L 365,120 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'section-105-108')?.status, 0.45)}
              stroke={selectedZoneId === 'section-105-108' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'section-105-108')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'section-105-108' ? '3' : '1.5'}
              onClick={() => onSelectZone('section-105-108')}
            />
            <text x="350" y="204" textAnchor="middle" fontSize="10" transform="rotate(90,350,204)">SEC 105-108</text>

            {/* Sections 109-112 (Bottom) */}
            <path
              d="M 160,270 L 340,270 L 320,300 L 180,300 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'section-109-112')?.status, 0.45)}
              stroke={selectedZoneId === 'section-109-112' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'section-109-112')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'section-109-112' ? '3' : '1.5'}
              onClick={() => onSelectZone('section-109-112')}
            />
            <text x="250" y="290" textAnchor="middle" fontSize="10">SEC 109-112</text>

            {/* Sections 113-116 (Left) */}
            <path
              d="M 165,140 L 165,260 L 135,280 L 135,120 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'section-113-116')?.status, 0.45)}
              stroke={selectedZoneId === 'section-113-116' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'section-113-116')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'section-113-116' ? '3' : '1.5'}
              onClick={() => onSelectZone('section-113-116')}
            />
            <text x="150" y="204" textAnchor="middle" fontSize="10" transform="rotate(-90,150,204)">SEC 113-116</text>


            {/* 2. CONCOURSES (Middle Ring) */}
            {/* Concourse L1 East */}
            <path
              d="M 375,110 A 180,180 0 0,1 375,290 L 405,320 A 220,220 0 0,0 405,80 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'concourse-l1-east')?.status, 0.45)}
              stroke={selectedZoneId === 'concourse-l1-east' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'concourse-l1-east')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'concourse-l1-east' ? '3' : '1.5'}
              onClick={() => onSelectZone('concourse-l1-east')}
            />
            <text x="390" y="204" textAnchor="middle" fontSize="9" transform="rotate(90,390,204)" fill="#ccc">CONCOURSE L1 E</text>

            {/* Concourse L1 West */}
            <path
              d="M 125,110 A 180,180 0 0,0 125,290 L 95,320 A 220,220 0 0,1 95,80 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'concourse-l1-west')?.status, 0.45)}
              stroke={selectedZoneId === 'concourse-l1-west' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'concourse-l1-west')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'concourse-l1-west' ? '3' : '1.5'}
              onClick={() => onSelectZone('concourse-l1-west')}
            />
            <text x="110" y="204" textAnchor="middle" fontSize="9" transform="rotate(-90,110,204)" fill="#ccc">CONCOURSE L1 W</text>

            {/* Concourse L2 North */}
            <path
              d="M 135,70 A 210,130 0 0,1 365,70 L 385,45 A 250,160 0 0,0 115,45 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'concourse-l2-north')?.status, 0.45)}
              stroke={selectedZoneId === 'concourse-l2-north' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'concourse-l2-north')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'concourse-l2-north' ? '3' : '1.5'}
              onClick={() => onSelectZone('concourse-l2-north')}
            />
            <text x="250" y="58" textAnchor="middle" fontSize="8" fill="#ccc">CONCOURSE LEVEL 2 NORTH</text>

            {/* Concourse L2 South */}
            <path
              d="M 135,330 A 210,130 0 0,0 365,330 L 385,355 A 250,160 0 0,1 115,355 Z"
              fill={getStatusColor(zones.find(z => z.zoneId === 'concourse-l2-south')?.status, 0.45)}
              stroke={selectedZoneId === 'concourse-l2-south' ? 'var(--text-primary)' : getStatusColor(zones.find(z => z.zoneId === 'concourse-l2-south')?.status, 0.8)}
              strokeWidth={selectedZoneId === 'concourse-l2-south' ? '3' : '1.5'}
              onClick={() => onSelectZone('concourse-l2-south')}
            />
            <text x="250" y="348" textAnchor="middle" fontSize="8" fill="#ccc">CONCOURSE LEVEL 2 SOUTH</text>


            {/* 3. ENTRANCE GATES (Outer Rings) */}
            {/* Gate A (Top Left) */}
            <circle cx="80" cy="50" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-a')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-a' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-a' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-a')}
            />
            <text x="80" y="54" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">A</text>

            {/* Gate B (Top Center) */}
            <circle cx="250" cy="20" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-b')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-b' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-b' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-b')}
            />
            <text x="250" y="24" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">B</text>

            {/* Gate C (Top Right) */}
            <circle cx="420" cy="50" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-c')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-c' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-c' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-c')}
            />
            <text x="420" y="54" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">C</text>

            {/* Gate D (Right Middle) */}
            <circle cx="460" cy="200" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-d')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-d' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-d' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-d')}
            />
            <text x="460" y="204" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">D</text>

            {/* Gate E (Bottom Right) */}
            <circle cx="420" cy="350" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-e')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-e' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-e' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-e')}
            />
            <text x="420" y="354" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">E</text>

            {/* Gate F (Bottom Center) */}
            <circle cx="250" cy="380" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-f')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-f' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-f' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-f')}
            />
            <text x="250" y="384" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">F</text>

            {/* Gate G (Bottom Left) */}
            <circle cx="80" cy="350" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-g')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-g' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-g' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-g')}
            />
            <text x="80" y="354" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">G</text>

            {/* Gate H (Left Middle) */}
            <circle cx="40" cy="200" r="14"
              fill={getStatusColor(zones.find(z => z.zoneId === 'gate-h')?.status, 0.6)}
              stroke={selectedZoneId === 'gate-h' ? '#fff' : '#444'} strokeWidth={selectedZoneId === 'gate-h' ? '3.5' : '1.5'}
              onClick={() => onSelectZone('gate-h')}
            />
            <text x="40" y="204" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">H</text>
          </svg>
        </div>

        {/* Auxiliary Zones (Food Stalls, Merch) */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auxiliary Conveniences Heatmap</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {zones.filter(z => ['FoodStall', 'Merch'].includes(z.category) || z.zoneId.includes('stall') || z.zoneId.includes('store')).map(z => (
              <div
                key={z.zoneId}
                onClick={() => onSelectZone(z.zoneId)}
                className={`zone-card status-${z.status} ${selectedZoneId === z.zoneId ? 'selected' : ''}`}
                style={{ padding: '8px 12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name.replace('Concourse', '').trim()}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{getPercentage(z)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Details / AI Recommendations Side Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="zone-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '15px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selectedZone.name}</h3>
              <span className="zone-category">{selectedZone.category}</span>
            </div>
            <span
              className="status-badge"
              style={{
                background: getStatusColor(selectedZone.status, 0.15),
                color: getStatusColor(selectedZone.status),
                border: `1px solid ${getStatusColor(selectedZone.status, 0.3)}`
              }}
            >
              {selectedZone.status} Status
            </span>
          </div>

          {/* Density indicators */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Density / Load Ratio</span>
              <span style={{ fontWeight: 'bold', color: getStatusColor(selectedZone.status) }}>
                {getPercentage(selectedZone)}%
              </span>
            </div>
            <div className="zone-progress-container" style={{ height: '8px' }}>
              <div
                className={`zone-progress-bar status-${selectedZone.status}`}
                style={{ width: `${getPercentage(selectedZone)}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              <span>Occupancy: {selectedZone.currentCount.toLocaleString()}</span>
              <span>Total Capacity: {selectedZone.capacity.toLocaleString()}</span>
            </div>
          </div>

          {/* AI Crowd Management Analysis section */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <BellRing size={16} style={{ color: 'var(--color-primary)' }} />
              GenAI Crowd Safety Directive
            </h4>

            {selectedZone.status === 'Normal' ? (
              <div className="empty-state" style={{ height: 'auto', padding: '1.5rem 0', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                <Info size={32} />
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Zone density is healthy. AI monitors live feeds. Directives will generate if load crosses 75% threshold.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {zoneAlerts.length > 0 ? (
                  <>
                    <div className="alert-item" style={{ borderLeftColor: getStatusColor(selectedZone.status), background: 'rgba(0,0,0,0.15)', padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusColor(selectedZone.status), fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                        <AlertTriangle size={14} />
                        AI Detected Risk: {zoneAlerts[0].riskLevel}
                      </div>
                      
                      <div className="detail-section" style={{ padding: '8px 0' }}>
                        <div className="detail-label">Root Cause Guess</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{zoneAlerts[0].rootCause}</p>
                      </div>

                      <div className="detail-section" style={{ padding: '8px 0' }}>
                        <div className="detail-label">Crowd-Control Dispatch Directive</div>
                        <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500, borderLeft: '2px solid var(--color-accent)', paddingLeft: '8px', background: 'rgba(245,158,11,0.05)', padding: '6px' }}>
                          {zoneAlerts[0].suggestedAction}
                        </p>
                      </div>

                      <div className="detail-section" style={{ padding: '8px 0', borderBottom: 'none' }}>
                        <div className="detail-label">Fan PA Announcement (Auto-broadcast)</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          &ldquo;{zoneAlerts[0].fanAnnouncement}&rdquo;
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state" style={{ height: 'auto', padding: '1.5rem 0' }}>
                    <div className="spinner" style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.8rem' }}>Generating fresh Gemini recommendation...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mini stats tracker */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px', marginTop: '15px', display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div>ALERT COOLDOWN: 45S</div>
          <div>•</div>
          <div>REAL-TIME FEED</div>
          <div>•</div>
          <div>RE-CALC: 4S</div>
        </div>
      </div>
    </div>
  );
}
