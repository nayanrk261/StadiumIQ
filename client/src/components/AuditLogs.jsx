import React from 'react';
import { Eye, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function AuditLogs({ incidents }) {
  const getActionBadge = (action) => {
    switch (action) {
      case 'Accepted':
        return <span className="audit-badge Accepted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Approved</span>;
      case 'Overridden':
        return <span className="audit-badge Overridden" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Overridden</span>;
      default:
        return <span className="audit-badge Pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={12} /> Pending operator verify</span>;
    }
  };

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'Critical': return { color: '#ef4444', fontWeight: 'bold' };
      case 'High': return { color: '#f59e0b', fontWeight: 'bold' };
      case 'Medium': return { color: '#6366f1', fontWeight: 'bold' };
      default: return { color: '#10b981', fontWeight: 'bold' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="zone-header" style={{ marginBottom: '1.5rem' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>
          <FileText size={20} style={{ color: 'var(--color-primary)' }} />
          Human-in-the-Loop Audit Trails
        </h3>
        <span className="zone-category">
          Audit Records: {incidents.length}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Safety-critical incident audit trails. Logs all incidents, original Gemini triage suggestions, and subsequent operator modifications:
      </p>

      <div style={{ overflowX: 'auto' }}>
        {incidents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No incidents triaged yet. Perform dispatch evaluations under the Incident Copilot tab.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: '800px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Timestamp</th>
                <th style={{ padding: '10px' }}>Incident Reported</th>
                <th style={{ padding: '10px' }}>AI Recommended Dispatch</th>
                <th style={{ padding: '10px' }}>Operator Intervention Status</th>
                <th style={{ padding: '10px' }}>Audit Resolution Notes</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => {
                const isOverridden = inc.operatorAction === 'Overridden';
                return (
                  <tr
                    key={inc._id}
                    style={{
                      borderBottom: '1px solid var(--border-glass)',
                      background: isOverridden ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(inc.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 500, color: '#fff', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.incidentText}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontSize: '0.8rem' }}>
                        Priority: <span style={getPriorityStyle(inc.priority)}>{inc.priority}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Teams: {inc.teamsDispatched.join(', ') || 'None'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {getActionBadge(inc.operatorAction)}
                    </td>
                    <td style={{ padding: '12px 10px', color: isOverridden ? 'var(--color-accent)' : 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '250px' }}>
                      {inc.operatorAction === 'Pending' ? (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Awaiting action...</span>
                      ) : (
                        inc.operatorNotes
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
