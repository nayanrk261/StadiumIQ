import { Zone, CrowdAlert } from '../models/db.js';
import { generateCrowdRecommendation } from './gemini.js';

export const MATCH_STATES = {
  PRE_MATCH: 'PRE_MATCH',       // High gate traffic, rising sections
  FIRST_HALF: 'FIRST_HALF',     // Empty gates/concourses, packed sections
  HALFTIME: 'HALFTIME',         // Empty sections, packed concourses, food courts & restrooms
  SECOND_HALF: 'SECOND_HALF',   // Back to sections, empty concourses
  POST_MATCH: 'POST_MATCH'      // Heavy gate exit traffic, sections emptying
};

let currentMatchState = MATCH_STATES.PRE_MATCH;
let simInterval = null;
const alertCooldowns = new Map(); // zoneId -> timestamp of last Gemini recommendation

// Helper to get random number between min and max
const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Adjust zone counts based on current match state.
 */
function simulateMovement(zone, matchState) {
  let count = zone.currentCount;
  const capacity = zone.capacity;

  switch (matchState) {
    case MATCH_STATES.PRE_MATCH:
      if (zone.category === 'Gate') {
        // Gates are very active: 60% to 95% capacity
        count = Math.floor(capacity * (randRange(60, 95) / 100));
      } else if (zone.category === 'Concourse') {
        // Concourse filling: 40% to 75% capacity
        count = Math.floor(capacity * (randRange(40, 75) / 100));
      } else if (zone.category === 'Section') {
        // Sections filling up: 30% to 70% capacity
        count = Math.min(capacity, count + randRange(50, 150));
      } else {
        // Food/merch stalls: moderately busy
        count = Math.floor(capacity * (randRange(30, 80) / 100));
      }
      break;

    case MATCH_STATES.FIRST_HALF:
      if (zone.category === 'Gate') {
        // Gates quiet down: 5% to 20% capacity
        count = Math.floor(capacity * (randRange(5, 20) / 100));
      } else if (zone.category === 'Concourse') {
        // Concourse clears out: 10% to 25% capacity
        count = Math.floor(capacity * (randRange(10, 25) / 100));
      } else if (zone.category === 'Section') {
        // Sections are packed: 85% to 99% capacity
        count = Math.floor(capacity * (randRange(85, 99) / 100));
      } else {
        // Stalls quiet: 10% to 30%
        count = Math.floor(capacity * (randRange(10, 30) / 100));
      }
      break;

    case MATCH_STATES.HALFTIME:
      if (zone.category === 'Gate') {
        // Gates quiet
        count = Math.floor(capacity * (randRange(5, 20) / 100));
      } else if (zone.category === 'Concourse') {
        // Concourses flood: 80% to 100% capacity
        count = Math.floor(capacity * (randRange(80, 100) / 100));
      } else if (zone.category === 'Section') {
        // Sections temporarily empty: 40% to 65% capacity
        count = Math.floor(capacity * (randRange(40, 65) / 100));
      } else {
        // Food stalls and Merch Megastore spike heavily: 85% to 105% capacity (overcrowd)
        count = Math.floor(capacity * (randRange(85, 105) / 100));
      }
      break;

    case MATCH_STATES.SECOND_HALF:
      if (zone.category === 'Gate') {
        // Gates quiet
        count = Math.floor(capacity * (randRange(5, 20) / 100));
      } else if (zone.category === 'Concourse') {
        // Concourse clears
        count = Math.floor(capacity * (randRange(10, 25) / 100));
      } else if (zone.category === 'Section') {
        // Sections packed again: 90% to 100% capacity
        count = Math.floor(capacity * (randRange(90, 100) / 100));
      } else {
        // Stalls quiet
        count = Math.floor(capacity * (randRange(10, 25) / 100));
      }
      break;

    case MATCH_STATES.POST_MATCH:
      if (zone.category === 'Gate') {
        // Gates are flooded with departing fans: 85% to 105% capacity
        count = Math.floor(capacity * (randRange(85, 105) / 100));
      } else if (zone.category === 'Concourse') {
        // Concourses flooded: 70% to 95% capacity
        count = Math.floor(capacity * (randRange(70, 95) / 100));
      } else if (zone.category === 'Section') {
        // Sections emptying fast: 5% to 30% capacity
        count = Math.max(0, count - randRange(150, 300));
      } else {
        // Stalls quiet down
        count = Math.floor(capacity * (randRange(10, 40) / 100));
      }
      break;
  }

  // Ensure count stays positive and capped near realistic limits
  return Math.max(0, Math.min(count, Math.floor(capacity * 1.15)));
}

/**
 * Main simulation step run on interval.
 */
async function runSimulationStep(io) {
  try {
    const zones = await Zone.find({});
    const updatedZones = [];

    for (const zone of zones) {
      const newCount = simulateMovement(zone, currentMatchState);
      const density = newCount / zone.capacity;
      
      let status = 'Normal';
      if (density >= 0.90) {
        status = 'Danger';
      } else if (density >= 0.75) {
        status = 'Warning';
      }

      // Update zone in database
      const updatedZone = await Zone.findOneAndUpdate(
        { zoneId: zone.zoneId },
        { $set: { currentCount: newCount, status: status } },
        { new: true }
      );

      updatedZones.push(updatedZone);

      // Handle Gemini Crowd recommendations if Warning or Danger
      if (status === 'Warning' || status === 'Danger') {
        const now = Date.now();
        const lastAlertTime = alertCooldowns.get(zone.zoneId) || 0;
        const COOLDOWN_MS = 45000; // 45 seconds cooldown to prevent API spam

        if (now - lastAlertTime > COOLDOWN_MS) {
          alertCooldowns.set(zone.zoneId, now);
          console.log(`[Simulator] Zone "${zone.name}" crossed threshold (${(density * 100).toFixed(0)}%). Requesting GenAI recommendation...`);

          // Fetch recent alerts for context
          const recentAlerts = await CrowdAlert.find({ zoneId: zone.zoneId });
          const alertHistory = recentAlerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3);

          // Call Gemini
          const aiRec = await generateCrowdRecommendation(updatedZone, alertHistory);

          // Save to database
          const crowdAlert = await CrowdAlert.create({
            zoneId: zone.zoneId,
            zoneName: zone.name,
            riskLevel: aiRec.riskLevel || (status === 'Danger' ? 'Critical' : 'High'),
            rootCause: aiRec.rootCause || 'High traffic volume.',
            suggestedAction: aiRec.suggestedAction || 'Deploy staff to direct crowd flow.',
            fanAnnouncement: aiRec.fanAnnouncement || 'Please move carefully through the gates.'
          });

          // Broadcast alert via Socket.io
          io.emit('new_alert', crowdAlert);
          console.log(`[Simulator] Broadcasted new GenAI alert for "${zone.name}".`);
        }
      }
    }

    // Broadcast updated zones to dashboard
    io.emit('zone_updates', updatedZones);

  } catch (err) {
    console.error('[Simulator] Error in simulation step:', err);
  }
}

export function startSimulator(io) {
  if (simInterval) clearInterval(simInterval);
  
  console.log(' [32m[Simulator] Starting crowd simulation loop (4s interval) [0m');
  simInterval = setInterval(() => runSimulationStep(io), 4000);
}

export function stopSimulator() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    console.log(' [33m[Simulator] Stopped crowd simulation loop [0m');
  }
}

export function getMatchState() {
  return currentMatchState;
}

export function setMatchState(state) {
  if (MATCH_STATES[state]) {
    currentMatchState = state;
    console.log(` [35m[Simulator] Match state updated to: ${state} [0m`);
    return true;
  }
  return false;
}
