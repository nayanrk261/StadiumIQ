import React, { useState, useEffect } from 'react';
import { io as socketIo } from 'socket.io-client';
import { Activity, ShieldAlert, Navigation, FileText, Globe, BellRing } from 'lucide-react';
import CrowdHeatmap from './components/CrowdHeatmap';
import ControlRoomCopilot from './components/ControlRoomCopilot';
import Wayfinding from './components/Wayfinding';
import AuditLogs from './components/AuditLogs';
import SimulatorControls from './components/SimulatorControls';
import FanAssistant from './components/FanAssistant';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = socketIo(BACKEND_URL);

export default function App() {
  const [activeTab, setActiveTab] = useState('heatmap');
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('gate-b');
  const [matchState, setMatchState] = useState('PRE_MATCH');
  const [notification, setNotification] = useState(null);

  // Load initial data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [zonesRes, alertsRes, incidentsRes, simRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/zones`),
          fetch(`${BACKEND_URL}/api/alerts`),
          fetch(`${BACKEND_URL}/api/incidents`),
          fetch(`${BACKEND_URL}/api/simulator/state`)
        ]);

        const zonesData = await zonesRes.json();
        const alertsData = await alertsRes.json();
        const incidentsData = await incidentsRes.json();
        const simData = await simRes.json();

        setZones(zonesData);
        setAlerts(alertsData);
        setIncidents(incidentsData);
        setMatchState(simData.matchState);
      } catch (err) {
        console.error('Failed to load initial stadium data:', err);
      }
    }

    fetchInitialData();
  }, []);

  // Socket.io telemetry listener
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to StadiumIQ Socket.io telemetry stream');
    });

    socket.on('zone_updates', (updatedZones) => {
      setZones(updatedZones);
    });

    socket.on('new_alert', (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
      triggerVisualNotification(`🚨 GenAI Alert: ${newAlert.zoneName} risk elevated to ${newAlert.riskLevel}!`);
    });

    socket.on('new_incident', (newIncident) => {
      setIncidents((prev) => [newIncident, ...prev]);
      triggerVisualNotification(`⚠️ New Control Room Incident Triaged: Priority ${newIncident.priority}!`);
    });

    socket.on('update_incident', (updatedIncident) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === updatedIncident._id ? updatedIncident : inc))
      );
    });

    socket.on('match_state_change', ({ matchState: newState }) => {
      setMatchState(newState);
      triggerVisualNotification(`ℹ️ Stadium Operations Cycle shifted to: ${newState.replace('_', ' ')}`);
    });

    return () => {
      socket.off('connect');
      socket.off('zone_updates');
      socket.off('new_alert');
      socket.off('new_incident');
      socket.off('update_incident');
      socket.off('match_state_change');
    };
  }, []);

  const triggerVisualNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // API Call actions
  const handleReportIncident = async (incidentText) => {
    const res = await fetch(`${BACKEND_URL}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentText })
    });
    return await res.json();
  };

  const handleResolveIncident = async (id, updateBody) => {
    const res = await fetch(`${BACKEND_URL}/api/incidents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody)
    });
    return await res.json();
  };

  const handleNavigate = async (startZoneId, endZoneId) => {
    const res = await fetch(`${BACKEND_URL}/api/navigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startZoneId, endZoneId })
    });
    return await res.json();
  };

  const handleSendFanMessage = async (message, history) => {
    const chatHistory = history.map(m => ({
      sender: m.sender === 'bot' ? 'bot' : 'user',
      text: m.text
    }));

    const res = await fetch(`${BACKEND_URL}/api/fan-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatHistory })
    });
    const data = await res.json();
    return data.response;
  };

  const handleChangeSimState = async (newState) => {
    const res = await fetch(`${BACKEND_URL}/api/simulator/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchState: newState })
    });
    const data = await res.json();
    if (data.success) {
      setMatchState(newState);
    }
  };

  return (
    <div className="app-container">
      {/* Header Banner */}
      <header className="app-header">
        <div className="brand">
          <h1>StadiumIQ</h1>
          <span>FIFA 2026 digital twin</span>
        </div>

        {/* Global Notifications marquee */}
        {notification && (
          <div
            className="glass-panel"
            style={{
              padding: '6px 18px',
              fontSize: '0.82rem',
              color: '#fff',
              borderLeft: '3px solid var(--color-primary)',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              animation: 'slide-up 0.2s ease-out'
            }}
          >
            {notification}
          </div>
        )}

        <div className="header-status">
          {/* Navigation Controls inside header */}
          <nav className="nav-tabs">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`nav-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
            >
              <Activity size={16} />
              Digital Twin
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`nav-tab ${activeTab === 'copilot' ? 'active' : ''}`}
            >
              <ShieldAlert size={16} />
              Incident Copilot
            </button>
            <button
              onClick={() => setActiveTab('wayfinding')}
              className={`nav-tab ${activeTab === 'wayfinding' ? 'active' : ''}`}
            >
              <Navigation size={16} />
              Wayfinding
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
            >
              <FileText size={16} />
              Audit Log
            </button>
          </nav>
        </div>
      </header>

      {/* Main dashboard content body */}
      <main className="main-content">
        {/* Simulator controller (visible above all screens to encourage interaction) */}
        <div style={{ marginBottom: '2rem' }}>
          <SimulatorControls
            activeState={matchState}
            onChangeState={handleChangeSimState}
          />
        </div>

        {/* Render selected Dashboard tab */}
        {activeTab === 'heatmap' && (
          <CrowdHeatmap
            zones={zones}
            alerts={alerts}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
          />
        )}

        {activeTab === 'copilot' && (
          <ControlRoomCopilot
            incidents={incidents}
            onReportIncident={handleReportIncident}
            onResolveIncident={handleResolveIncident}
          />
        )}

        {activeTab === 'wayfinding' && (
          <Wayfinding
            zones={zones}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogs
            incidents={incidents}
          />
        )}
      </main>

      {/* Floating Fan Assistant Chat widget (available globally) */}
      <FanAssistant
        onSendMessage={handleSendFanMessage}
      />
    </div>
  );
}
