import express from 'express';
import { Zone, CrowdAlert, Incident, VenueInfo } from './models/db.js';
import { triageIncident, generateDirections, runFanChatbot } from './services/gemini.js';
import { getMatchState, setMatchState, MATCH_STATES } from './services/simulator.js';

export function createRouter(io) {
  const router = express.Router();

  // GET /api/zones - Fetch all stadium zones
  router.get('/zones', async (req, res) => {
    try {
      const zones = await Zone.find({});
      res.json(zones);
    } catch (err) {
      console.error('Error fetching zones:', err);
      res.status(500).json({ error: 'Failed to fetch zones' });
    }
  });

  // GET /api/alerts - Fetch history of crowd density alerts
  router.get('/alerts', async (req, res) => {
    try {
      const alerts = await CrowdAlert.find({});
      const sortedAlerts = alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      res.json(sortedAlerts.slice(0, 50)); // Limit to last 50
    } catch (err) {
      console.error('Error fetching alerts:', err);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // GET /api/incidents - Fetch all reported incidents
  router.get('/incidents', async (req, res) => {
    try {
      const incidents = await Incident.find({});
      const sortedIncidents = incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      res.json(sortedIncidents);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  });

  // POST /api/incidents - Operator reports a new incident
  router.post('/incidents', async (req, res) => {
    try {
      const { incidentText } = req.body;
      if (!incidentText || incidentText.trim() === '') {
        return res.status(400).json({ error: 'Incident description is required' });
      }

      // Triage with Gemini
      console.log(`[Copilot] Triaging incident: "${incidentText}"`);
      const triage = await triageIncident(incidentText);

      // Create new incident doc
      const newIncident = await Incident.create({
        incidentText,
        priority: triage.priority || 'Medium',
        teamsDispatched: triage.teamsDispatched || [],
        needsEscalation: triage.needsEscalation || false,
        suggestedResolution: triage.suggestedResolution || 'Monitor and investigate.',
        operatorAction: 'Pending',
        operatorNotes: ''
      });

      // Broadcast to client control rooms
      io.emit('new_incident', newIncident);

      res.status(201).json(newIncident);
    } catch (err) {
      console.error('Error creating incident:', err);
      res.status(500).json({ error: 'Failed to report and triage incident' });
    }
  });

  // PUT /api/incidents/:id - Operator accepts/overrides AI suggestion
  router.put('/incidents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { operatorAction, operatorNotes, priority, teamsDispatched } = req.body;

      if (!['Accepted', 'Overridden'].includes(operatorAction)) {
        return res.status(400).json({ error: 'Invalid operator action value' });
      }

      // Prepare updates
      const updateData = {
        operatorAction,
        operatorNotes: operatorNotes || ''
      };

      // If operator overrides, they can supply customized values
      if (priority) updateData.priority = priority;
      if (teamsDispatched) updateData.teamsDispatched = teamsDispatched;

      const updatedIncident = await Incident.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { new: true }
      );

      if (!updatedIncident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Emit real-time change to all operator dashboards
      io.emit('update_incident', updatedIncident);

      res.json(updatedIncident);
    } catch (err) {
      console.error('Error updating incident:', err);
      res.status(500).json({ error: 'Failed to update incident action' });
    }
  });

  // POST /api/navigation - Wayfinding routing
  router.post('/navigation', async (req, res) => {
    try {
      const { startZoneId, endZoneId } = req.body;
      if (!startZoneId || !endZoneId) {
        return res.status(400).json({ error: 'Start and destination zones are required' });
      }

      const startZone = await Zone.findOne({ zoneId: startZoneId });
      const endZone = await Zone.findOne({ zoneId: endZoneId });

      if (!startZone || !endZone) {
        return res.status(404).json({ error: 'One or both zones not found' });
      }

      console.log(`[Wayfinding] Generating route from "${startZone.name}" to "${endZone.name}"`);
      const navigation = await generateDirections(startZone.name, endZone.name);

      res.json({
        startZone,
        endZone,
        directions: navigation.directions,
        path: navigation.path
      });
    } catch (err) {
      console.error('Error in wayfinding navigation:', err);
      res.status(500).json({ error: 'Failed to generate navigation routes' });
    }
  });

  // POST /api/fan-chat - Chat with ground AI grounded in venue info + live alerts
  router.post('/fan-chat', async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Gather grounding info
      const venueInfoDocs = await VenueInfo.find({});
      const venueContext = {};
      venueInfoDocs.forEach(doc => {
        venueContext[doc.type] = doc.data;
      });

      // Gather live crowd warnings
      const warningZones = await Zone.find({ status: { $in: ['Warning', 'Danger'] } });
      venueContext.activeAlerts = warningZones.map(z => ({
        zoneName: z.name,
        occupancyRatio: ((z.currentCount / z.capacity) * 100).toFixed(0) + '%',
        status: z.status
      }));

      console.log(`[Fan Chat] Received message: "${message}"`);
      const responseText = await runFanChatbot(message, chatHistory || [], venueContext);

      res.json({ response: responseText });
    } catch (err) {
      console.error('Error in fan chatbot:', err);
      res.status(500).json({ error: 'Failed to process fan assistant request' });
    }
  });

  // GET /api/venue-info - Fetch match schedule and basic metadata
  router.get('/venue-info', async (req, res) => {
    try {
      const scheduleDoc = await VenueInfo.findOne({ type: 'schedule' });
      const gatesDoc = await VenueInfo.findOne({ type: 'gates' });
      const amenitiesDoc = await VenueInfo.findOne({ type: 'amenities' });

      res.json({
        schedule: scheduleDoc ? scheduleDoc.data : null,
        gates: gatesDoc ? gatesDoc.data : null,
        amenities: amenitiesDoc ? amenitiesDoc.data : null
      });
    } catch (err) {
      console.error('Error fetching venue info:', err);
      res.status(500).json({ error: 'Failed to fetch venue information' });
    }
  });

  // GET /api/simulator/state - Fetch current simulator state
  router.get('/simulator/state', (req, res) => {
    res.json({
      matchState: getMatchState(),
      availableStates: Object.keys(MATCH_STATES)
    });
  });

  // POST /api/simulator/state - Set simulator match state
  router.post('/simulator/state', (req, res) => {
    const { matchState } = req.body;
    const success = setMatchState(matchState);
    if (success) {
      // Broadcast match state change via Socket.io
      io.emit('match_state_change', { matchState });
      res.json({ success: true, matchState });
    } else {
      res.status(400).json({ error: 'Invalid match state' });
    }
  });

  return router;
}
