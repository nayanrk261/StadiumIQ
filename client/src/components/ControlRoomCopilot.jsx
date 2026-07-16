import React, { useState } from 'react';
import { Send, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, Users, Activity } from 'lucide-react';

export default function ControlRoomCopilot({ incidents, onReportIncident, onResolveIncident }) {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  
  // Override form states
  const [isOverriding, setIsOverriding] = useState(false);
  const [overridePriority, setOverridePriority] = useState('Medium');
  const [overrideTeams, setOverrideTeams] = useState([]);
  const [overrideNotes, setOverrideNotes] = useState('');

  const selectedIncident = incidents.find(i => i._id === selectedIncidentId) || incidents[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSubmitting(true);
    try {
      const newInc = await onReportIncident(inputText);
      if (newInc && newInc._id) {
        setSelectedIncidentId(newInc._id);
      }
      setInputText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedIncident) return;
    try {
      await onResolveIncident(selectedIncident._id, {
        operatorAction: 'Accepted',
        operatorNotes: 'AI recommendations approved without modifications.'
      });
      setIsOverriding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const startOverride = () => {
    if (!selectedIncident) return;
    setOverridePriority(selectedIncident.priority);
    setOverrideTeams([...selectedIncident.teamsDispatched]);
    setOverrideNotes('');
    setIsOverriding(true);
  };

  const toggleTeamOverride = (team) => {
    if (overrideTeams.includes(team)) {
      setOverrideTeams(overrideTeams.filter(t => t !== team));
    } else {
      setOverrideTeams([...overrideTeams, team]);
    }
  };

  const submitOverride = async () => {
    if (!selectedIncident) return;
    try {
      await onResolveIncident(selectedIncident._id, {
        operatorAction: 'Overridden',
        operatorNotes: overrideNotes || 'Operator overrode priority/teams based on control room inspection.',
        priority: overridePriority,
        teamsDispatched: overrideTeams
      });
      setIsOverriding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const teamOptions = [
    'Medical Team',
    'Security Detail',
    'Crowd Control',
    'Facilities Maintenance',
    'Host Nation Liaison'
  ];

  return (
    <div className="copilot-container">
      {/* Left Panel: Reporter & Timeline */}
      <div className="glass-panel chat-box">
        <h3 className="panel-title">
          <ShieldAlert size={20} style={{ color: 'var(--color-primary)' }} />
          Operator Incident Logger
        </h3>

        {/* Report form */}
        <form onSubmit={handleSubmit} className="chat-input-form" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type incident report (e.g. 'Medical team requested near Gate F due to heat fainting')..."
            className="chat-input"
            disabled={submitting}
          />
          <button type="submit" className="btn" disabled={submitting || !inputText.trim()}>
            {submitting ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
            ) : (
              <Send size={16} />
            )}
            Report
          </button>
        </form>

        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Active Log History
        </h4>

        {/* Timeline list */}
        <div className="chat-messages" style={{ overflowY: 'auto' }}>
          {incidents.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={48} />
              <p>No incidents logged. Type an incident above to see Gemini triage in action.</p>
            </div>
          ) : (
            incidents.map((inc) => {
              const isActive = selectedIncident?._id === inc._id;
              return (
                <div
                  key={inc._id}
                  onClick={() => {
                    setSelectedIncidentId(inc._id);
                    setIsOverriding(false);
                  }}
                  className={`audit-card ${isActive ? 'selected' : ''}`}
                  style={{
                    cursor: 'pointer',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--border-glass)',
                    background: isActive ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                  }}
                >
                  <div className="audit-header">
                    <span className={`priority-badge ${inc.priority}`}>{inc.priority}</span>
                    <span className={`audit-badge ${inc.operatorAction}`}>{inc.operatorAction}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 500, margin: '5px 0' }}>
                    {inc.incidentText}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(inc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: AI Triage Suggestion */}
      <div className="glass-panel copilot-details">
        {selectedIncident ? (
          <div>
            <div className="zone-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Copilot Decision Triage</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Incident Ref: #{selectedIncident._id}
                </p>
              </div>
              <span className={`priority-badge ${selectedIncident.priority}`}>
                {selectedIncident.priority} Priority
              </span>
            </div>

            <div className="detail-section">
              <div className="detail-label">Original Dispatch Log</div>
              <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>
                &ldquo;{selectedIncident.incidentText}&rdquo;
              </p>
            </div>

            {/* Standard AI Suggestion Details */}
            {!isOverriding ? (
              <>
                <div className="detail-section">
                  <div className="detail-label">AI Dispatched Responders</div>
                  <div className="teams-list">
                    {selectedIncident.teamsDispatched.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No specific teams recommended.</span>
                    ) : (
                      selectedIncident.teamsDispatched.map(team => (
                        <span key={team} className="team-chip" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-glow)' }}>
                          {team}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-label">Escalation Threshold</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    {selectedIncident.needsEscalation ? (
                      <>
                        <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>YES - Human Venue Commander Escalation Recommended</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} style={{ color: 'var(--color-normal)' }} />
                        <span style={{ color: 'var(--color-normal)' }}>No - Standard Field De-escalation Protocol</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-label">Suggested Resolution Strategy</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                    {selectedIncident.suggestedResolution}
                  </p>
                </div>

                {selectedIncident.operatorAction === 'Pending' ? (
                  <div className="detail-section" style={{ borderBottom: 'none' }}>
                    <div className="detail-label" style={{ marginBottom: '10px' }}>Verify AI Dispatch Suggestions (Human-in-the-Loop)</div>
                    <div className="suggestion-actions">
                      <button className="btn btn-success" style={{ flex: 1 }} onClick={handleAccept}>
                        <CheckCircle2 size={16} />
                        Accept Dispatch
                      </button>
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={startOverride}>
                        Override Triage
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section" style={{ borderBottom: 'none', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                    <div className="detail-label">Human Operator Action Audit Trail</div>
                    <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                      Status: {selectedIncident.operatorAction === 'Accepted' ? 'APPROVED BY OPERATOR' : 'MODIFIED / OVERRIDDEN BY OPERATOR'}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Notes: {selectedIncident.operatorNotes}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Override Edit Form */
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '15px' }}>
                  Modify AI Triage Directives
                </h4>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Override Priority Level</label>
                  <select
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(e.target.value)}
                    className="select-control"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Select Teams to Dispatch</label>
                  <div className="teams-list" style={{ gap: '8px' }}>
                    {teamOptions.map(team => {
                      const selected = overrideTeams.includes(team);
                      return (
                        <button
                          key={team}
                          type="button"
                          onClick={() => toggleTeamOverride(team)}
                          className="team-chip"
                          style={{
                            background: selected ? 'var(--color-primary-glow)' : 'transparent',
                            borderColor: selected ? 'var(--color-primary)' : 'var(--border-glass)',
                            color: selected ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {team}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Operator Intervention Explanatory Notes (Audit Trail)</label>
                  <textarea
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    placeholder="Enter reason for overriding AI dispatch priorities..."
                    className="chat-input"
                    rows="3"
                    style={{ resize: 'none', height: '80px', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>

                <div className="suggestion-actions">
                  <button className="btn" style={{ flex: 1 }} onClick={submitOverride}>
                    Save Override
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsOverriding(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <HelpCircle size={48} />
            <p>Select an incident from the log history to review decision support triage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
