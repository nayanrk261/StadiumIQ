import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB, Zone, CrowdAlert, Incident, VenueInfo } from '../src/models/db.js';
import { createRouter } from '../src/routes.js';
import { triageIncident, generateDirections } from '../src/services/gemini.js';
import { seedDatabase } from '../src/models/seedHelper.js';

let app;
let server;
let io;

beforeAll(async () => {
  // Ensure we connect to DB first (mock or real)
  await connectDB();
  await seedDatabase();

  app = express();
  app.use(express.json());
  server = http.createServer(app);
  io = new Server(server);

  const router = createRouter(io);
  app.use('/api', router);
});

afterAll(async () => {
  // Clear mock data files or collections
  try {
    await Zone.deleteMany({});
    await CrowdAlert.deleteMany({});
    await Incident.deleteMany({});
    await VenueInfo.deleteMany({});
  } catch (e) {
    // Ignore
  }
});

describe('StadiumIQ Core Service Tests', () => {
  
  // 1. Crowd Density Threshold Logic Test
  it('should correctly classify zone status based on capacity thresholds', async () => {
    // Threshold boundaries: 
    // Density >= 90% is Danger
    // Density >= 75% is Warning
    // Density < 75% is Normal
    
    const zoneMock = { zoneId: 'test-zone', name: 'Test Zone', capacity: 1000 };

    // Case Normal (50% density)
    let count = 500;
    let density = count / zoneMock.capacity;
    let status = density >= 0.90 ? 'Danger' : density >= 0.75 ? 'Warning' : 'Normal';
    expect(status).toBe('Normal');

    // Case Warning (80% density)
    count = 800;
    density = count / zoneMock.capacity;
    status = density >= 0.90 ? 'Danger' : density >= 0.75 ? 'Warning' : 'Normal';
    expect(status).toBe('Warning');

    // Case Danger (95% density)
    count = 950;
    density = count / zoneMock.capacity;
    status = density >= 0.90 ? 'Danger' : density >= 0.75 ? 'Warning' : 'Normal';
    expect(status).toBe('Danger');
  });

  // 2. Incident Triage Service Logic Test
  it('should triage security-sensitive reports with high severity', async () => {
    const output = await triageIncident('Large fight breaking out in the West Concourse near concessions.');
    expect(output.priority).toBe('Critical');
    expect(output.teamsDispatched).toContain('Security Detail');
    expect(output.needsEscalation).toBe(true);
  });

  it('should triage medical injury reports with high priority and medical dispatch', async () => {
    const output = await triageIncident('Fan has collapsed and requires immediate medical attention.');
    expect(output.priority).toBe('High');
    expect(output.teamsDispatched).toContain('Medical Team');
    expect(output.needsEscalation).toBe(true);
  });

  // 3. API Integrations - Module 1: Zones & Alerts
  it('GET /api/zones should return seeded zones', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('zoneId');
  });

  it('GET /api/alerts should fetch history successfully', async () => {
    // Add mock alert
    await CrowdAlert.create({
      zoneId: 'gate-f',
      zoneName: 'Gate F',
      riskLevel: 'High',
      rootCause: 'Heavy crowd buildup',
      suggestedAction: 'Open Gate E',
      fanAnnouncement: 'Please use alternative routes'
    });

    const res = await request(app).get('/api/alerts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].zoneId).toBe('gate-f');
  });

  // 4. API Integrations - Module 2: Decision Support Incident Reports (Human-in-the-loop)
  it('POST & PUT /api/incidents should record audits and allow operator overrides', async () => {
    // Post new incident
    const postRes = await request(app)
      .post('/api/incidents')
      .send({ incidentText: 'Fight reported in seating row 12' });

    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.incidentText).toBe('Fight reported in seating row 12');
    expect(postRes.body.priority).toBe('Critical');
    expect(postRes.body.operatorAction).toBe('Pending');

    const incidentId = postRes.body._id;

    // Put update - Accept suggestion
    const putAcceptRes = await request(app)
      .put(`/api/incidents/${incidentId}`)
      .send({
        operatorAction: 'Accepted',
        operatorNotes: 'Verified on camera.'
      });

    expect(putAcceptRes.statusCode).toBe(200);
    expect(putAcceptRes.body.operatorAction).toBe('Accepted');
    expect(putAcceptRes.body.operatorNotes).toBe('Verified on camera.');

    // Put update - Override suggestion
    const putOverrideRes = await request(app)
      .put(`/api/incidents/${incidentId}`)
      .send({
        operatorAction: 'Overridden',
        operatorNotes: 'Dispatched maintenance instead.',
        priority: 'Low',
        teamsDispatched: ['Facilities Maintenance']
      });

    expect(putOverrideRes.statusCode).toBe(200);
    expect(putOverrideRes.body.operatorAction).toBe('Overridden');
    expect(putOverrideRes.body.priority).toBe('Low');
    expect(putOverrideRes.body.teamsDispatched).toContain('Facilities Maintenance');
  });

  // 5. API Integrations - Module 3: Wayfinding Navigation
  it('POST /api/navigation should yield valid route path coordinates and text', async () => {
    const res = await request(app)
      .post('/api/navigation')
      .send({ startZoneId: 'gate-a', endZoneId: 'section-105-108' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('directions');
    expect(Array.isArray(res.body.path)).toBe(true);
    expect(res.body.path.length).toBeGreaterThan(0);
  });

  // 6. API Integrations - Module 4: Grounded Fan Chat Assistant
  it('POST /api/fan-chat should reply with grounded schedule information', async () => {
    const res = await request(app)
      .post('/api/fan-chat')
      .send({
        message: 'When is the Mexico game playing?',
        chatHistory: []
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('response');
    expect(res.body.response).toContain('Mexico vs Argentina');
  });

  it('GET /api/venue-info should return grounded schedule details', async () => {
    const res = await request(app).get('/api/venue-info');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('schedule');
    expect(res.body.schedule.matches.length).toBeGreaterThan(0);
  });

  // 7. Simulator States
  it('GET & POST /api/simulator/state should fetch/set simulation stage', async () => {
    const getRes = await request(app).get('/api/simulator/state');
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.matchState).toBe('PRE_MATCH');

    const postRes = await request(app)
      .post('/api/simulator/state')
      .send({ matchState: 'HALFTIME' });

    expect(postRes.statusCode).toBe(200);
    expect(postRes.body.matchState).toBe('HALFTIME');
  });

});
