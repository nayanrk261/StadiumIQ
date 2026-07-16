import React, { useState } from 'react';
import { Compass, MapPin, Navigation, ArrowRight } from 'lucide-react';

const ZONE_COORDS = {
  'gate-a': { x: 150, y: 70, label: 'Gate A' },
  'gate-b': { x: 250, y: 40, label: 'Gate B' },
  'gate-c': { x: 350, y: 70, label: 'Gate C' },
  'gate-d': { x: 420, y: 200, label: 'Gate D' },
  'gate-e': { x: 350, y: 330, label: 'Gate E' },
  'gate-f': { x: 250, y: 360, label: 'Gate F' },
  'gate-g': { x: 150, y: 330, label: 'Gate G' },
  'gate-h': { x: 80, y: 200, label: 'Gate H' },
  
  'concourse-l1-east': { x: 340, y: 160, label: 'Concourse L1 E' },
  'concourse-l1-west': { x: 160, y: 160, label: 'Concourse L1 W' },
  'concourse-l2-north': { x: 250, y: 90, label: 'Concourse L2 N' },
  'concourse-l2-south': { x: 250, y: 310, label: 'Concourse L2 S' },
  
  'section-101-104': { x: 250, y: 130, label: 'SEC 101-104' },
  'section-105-108': { x: 310, y: 200, label: 'SEC 105-108' },
  'section-109-112': { x: 250, y: 270, label: 'SEC 109-112' },
  'section-113-116': { x: 190, y: 200, label: 'SEC 113-116' },
  'section-201-206': { x: 250, y: 105, label: 'SEC 201-206' },
  'section-207-212': { x: 250, y: 295, label: 'SEC 207-212' },

  'food-stall-east': { x: 330, y: 240, label: 'East Food Court' },
  'food-stall-west': { x: 170, y: 240, label: 'West Food Court' },
  'merch-megastore': { x: 250, y: 345, label: 'Merch Shop' }
};

export default function Wayfinding({ zones, onNavigate }) {
  if (!zones || zones.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', flexDirection: 'column', gap: '12px' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading wayfinding nodes...</span>
      </div>
    );
  }

  const [startZone, setStartZone] = useState('gate-a');
  const [destZone, setDestZone] = useState('section-105-108');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleNavigate = async () => {
    if (startZone === destZone) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await onNavigate(startZone, destZone);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Convert list of path node names to approximate zoneIds
  const getPathCoords = () => {
    if (!result || !result.path) return [];
    
    return result.path.map(nodeName => {
      // Find matching zone in coords by label or id
      const lowerName = nodeName.toLowerCase();
      const match = Object.entries(ZONE_COORDS).find(([id, coord]) => {
        return id === lowerName || 
               coord.label.toLowerCase() === lowerName ||
               lowerName.includes(id) ||
               lowerName.includes(coord.label.toLowerCase());
      });
      return match ? match[1] : null;
    }).filter(c => c !== null);
  };

  const pathCoords = getPathCoords();

  // Construct SVG path string for the routing overlay
  const buildSvgPath = () => {
    if (pathCoords.length < 2) return '';
    return `M ${pathCoords[0].x},${pathCoords[0].y} ` + 
      pathCoords.slice(1).map(c => `L ${c.x},${c.y}`).join(' ');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="zone-header" style={{ marginBottom: '1.5rem' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>
          <Compass size={20} style={{ color: 'var(--color-primary)' }} />
          Smart Wayfinding Assistant
        </h3>
        <span className="zone-category" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
          2D Telemetry Path
        </span>
      </div>

      <div className="wayfinding-grid">
        {/* Left Side: Selectors & Natural Language Directions */}
        <div className="wayfinding-controls" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} style={{ color: 'var(--color-normal)' }} />
              Current Location Zone
            </label>
            <select
              value={startZone}
              onChange={(e) => setStartZone(e.target.value)}
              className="select-control"
            >
              {zones.map(z => (
                <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} style={{ color: 'var(--color-danger)' }} />
              Target Destination
            </label>
            <select
              value={destZone}
              onChange={(e) => setDestZone(e.target.value)}
              className="select-control"
            >
              {zones.map(z => (
                <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNavigate}
            disabled={loading || startZone === destZone}
            className="btn"
            style={{ marginTop: '10px' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
            ) : (
              <Navigation size={16} />
            )}
            Calculate Indoor Route
          </button>

          {/* Direction Display Panel */}
          {result && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Navigation size={14} />
                GenAI Directional Guidance
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                {result.directions}
              </p>

              {/* Breadcrumbs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-normal)' }}>Route:</span>
                {result.path && result.path.map((node, idx) => (
                  <React.Fragment key={node}>
                    <span>{node}</span>
                    {idx < result.path.length - 1 && <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Visual Path Map */}
        <div className="wayfinding-map-container">
          <svg viewBox="0 0 500 400" style={{ width: '100%', height: '100%', maxHeight: '350px' }}>
            {/* Draw soccer field outline in grey for context */}
            <rect x="180" y="150" width="140" height="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" rx="4" />
            <circle cx="250" cy="200" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
            
            {/* Draw connections between points to visualize graph lanes */}
            <path d="M 150,70 L 250,40 L 350,70 L 420,200 L 350,330 L 250,360 L 150,330 L 80,200 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <path d="M 160,160 L 250,90 L 340,160 L 330,240 L 250,310 L 170,240 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

            {/* Draw nodes */}
            {Object.entries(ZONE_COORDS).map(([id, coord]) => {
              const isStart = id === startZone;
              const isDest = id === destZone;
              const inPath = pathCoords.some(c => c.label === coord.label);

              let nodeColor = 'rgba(255,255,255,0.1)';
              let radius = 5;

              if (isStart) {
                nodeColor = 'var(--color-normal)';
                radius = 7;
              } else if (isDest) {
                nodeColor = 'var(--color-danger)';
                radius = 7;
              } else if (inPath) {
                nodeColor = '#22d3ee'; // Cyan path color
                radius = 6;
              }

              return (
                <g key={id}>
                  <circle cx={coord.x} cy={coord.y} r={radius} fill={nodeColor} />
                  {(isStart || isDest) && (
                    <circle cx={coord.x} cy={coord.y} r={radius + 4} fill="none" stroke={nodeColor} strokeWidth="1" style={{ animation: 'pulse-glow 1.5s infinite' }} />
                  )}
                  {radius > 5 && (
                    <text x={coord.x} y={coord.y - 10} textAnchor="middle" fontSize="9" fill={isStart ? 'var(--color-normal)' : 'var(--color-danger)'} fontWeight="bold">
                      {coord.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Draw neon path overlay if route exists */}
            {pathCoords.length >= 2 && (
              <>
                {/* Glow filter */}
                <defs>
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d={buildSvgPath()}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neon-glow)"
                  strokeDasharray="6,5"
                  style={{ strokeDashoffset: 100, animation: 'dash 10s linear infinite' }}
                />
                
                {/* Animation style inside SVG */}
                <style>{`
                  @keyframes dash {
                    to {
                      stroke-dashoffset: 0;
                    }
                  }
                `}</style>
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
