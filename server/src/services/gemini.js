import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let genAI = null;
if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log(` [32m[Gemini] Initialized with model: ${MODEL_NAME} [0m`);
  } catch (err) {
    console.error(' [31m[Gemini] Failed to initialize Gemini client: [0m', err.message);
  }
} else {
  console.log(' [33m[Gemini] No GEMINI_API_KEY provided in env. Operating in offline/mock simulation mode. [0m');
}

/**
 * Helper to execute Gemini generation with JSON output configuration.
 */
async function callGeminiJSON(prompt, systemInstruction) {
  if (!genAI) {
    throw new Error('Gemini API is not configured.');
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json'
    },
    systemInstruction: systemInstruction
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

/**
 * Module 1: GenAI Crowd Safety Recommendation
 */
export async function generateCrowdRecommendation(zone, alertHistory = []) {
  const density = ((zone.currentCount / zone.capacity) * 100).toFixed(1);
  const systemInstruction = `You are StadiumIQ crowd-safety AI for FIFA World Cup 2026.
Analyze the stadium zone status and alert history.
You must output a JSON object containing:
{
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "rootCause": "A brief explanation of why this bottleneck is occurring",
  "suggestedAction": "One specific, clear operational redirection directive for stadium safety staff (e.g. open Gate C, divert sections 110-112)",
  "fanAnnouncement": "A polite, direct public address announcement for fans in plain language directing them where to go."
}`;

  const prompt = `Zone Data:
- ID: ${zone.zoneId}
- Name: ${zone.name}
- Category: ${zone.category}
- Capacity: ${zone.capacity}
- Current Occupancy: ${zone.currentCount} (${density}% capacity)
- Current Status: ${zone.status}

Recent Alerts:
${JSON.stringify(alertHistory, null, 2)}

Provide crowd management analysis now.`;

  if (!genAI) {
    return generateMockCrowdRecommendation(zone);
  }

  try {
    return await callGeminiJSON(prompt, systemInstruction);
  } catch (err) {
    console.error('[Gemini] generateCrowdRecommendation failed, returning mock.', err.message);
    return generateMockCrowdRecommendation(zone);
  }
}

function generateMockCrowdRecommendation(zone) {
  const density = ((zone.currentCount / zone.capacity) * 100).toFixed(1);
  let riskLevel = 'Low';
  let rootCause = 'Normal traffic flow.';
  let suggestedAction = 'Continue standard monitoring.';
  let fanAnnouncement = 'Welcome to StadiumIQ. Please proceed to your seats.';

  if (density >= 100) {
    riskLevel = 'Critical';
    rootCause = `Severe congestion spike at ${zone.name} (${density}% occupancy). Gate bottleneck or seating transition delay.`;
    suggestedAction = `Divert oncoming fans away from ${zone.name}. Open secondary emergency exits, deploy volunteers to Section 102.`;
    fanAnnouncement = `Attention fans near ${zone.name}: This area is extremely congested. Please follow steward instructions and use alternative concourses.`;
  } else if (density >= 80) {
    riskLevel = 'High';
    rootCause = `High concentration of fans entering ${zone.name} (${density}% occupancy) ahead of the match kickoff.`;
    suggestedAction = `Deploy crowd control marshals to check tickets early. Open adjacent bypass gates if available.`;
    fanAnnouncement = `${zone.name} is currently very busy. We recommend using adjacent paths or delaying arrival by a few minutes.`;
  } else if (density >= 60) {
    riskLevel = 'Medium';
    rootCause = `Moderate buildup in ${zone.name} (${density}% occupancy) typical during event entry or halftime.`;
    suggestedAction = `Monitor flow rate closely. Keep exit lanes clear.`;
    fanAnnouncement = `Gates are active. Please keep your digital tickets ready for scan.`;
  }

  return { riskLevel, rootCause, suggestedAction, fanAnnouncement };
}

/**
 * Module 2: Control Room Copilot Incident Triage
 */
export async function triageIncident(incidentText) {
  const systemInstruction = `You are a Stadium Control Room operations dispatch AI.
Triage the incident reported by staff or fans.
You must output a JSON object containing:
{
  "priority": "Low" | "Medium" | "High" | "Critical",
  "teamsDispatched": Array of strings (options: "Medical Team", "Security Detail", "Crowd Control", "Facilities Maintenance", "Host Nation Liaison"),
  "needsEscalation": true | false,
  "suggestedResolution": "One clear paragraph on response strategy and dispatcher next steps"
}`;

  const prompt = `Incident Details: "${incidentText}"`;

  if (!genAI) {
    return generateMockIncidentTriage(incidentText);
  }

  try {
    return await callGeminiJSON(prompt, systemInstruction);
  } catch (err) {
    console.error('[Gemini] triageIncident failed, returning mock.', err.message);
    return generateMockIncidentTriage(incidentText);
  }
}

function generateMockIncidentTriage(incidentText) {
  const text = incidentText.toLowerCase();
  let priority = 'Medium';
  let teamsDispatched = ['Security Detail'];
  let needsEscalation = false;
  let suggestedResolution = 'Verify incident reporting via overhead cameras and instruct nearby staff to monitor.';

  if (text.includes('fight') || text.includes('brawl') || text.includes('assault') || text.includes('riot')) {
    priority = 'Critical';
    teamsDispatched = ['Security Detail', 'Crowd Control'];
    needsEscalation = true;
    suggestedResolution = 'Dispatch immediate security response forces to de-escalate. Alert local law enforcement and notify venue commander. Redirect CCTV cameras to incident coordinate.';
  } else if (text.includes('medical') || text.includes('heart') || text.includes('fainted') || text.includes('injury') || text.includes('accident')) {
    priority = 'High';
    teamsDispatched = ['Medical Team', 'Security Detail'];
    needsEscalation = true;
    suggestedResolution = 'Deploy nearest static medical team and stretcher bearer. Security to clear path for medical vehicle. Notify supervisor.';
  } else if (text.includes('leak') || text.includes('broken') || text.includes('spill') || text.includes('light') || text.includes('fire')) {
    priority = text.includes('fire') ? 'Critical' : 'Low';
    teamsDispatched = text.includes('fire') ? ['Security Detail', 'Crowd Control'] : ['Facilities Maintenance'];
    needsEscalation = text.includes('fire') ? true : false;
    suggestedResolution = text.includes('fire')
      ? 'Trigger fire suppression response, isolate the zone, evacuate section immediately, and dispatch fire response.'
      : 'Create a maintenance ticket. Schedule cleanup/repair after current wave of fan entry.';
  } else if (text.includes('gate') || text.includes('crowd') || text.includes('bottleneck')) {
    priority = 'High';
    teamsDispatched = ['Crowd Control'];
    needsEscalation = false;
    suggestedResolution = 'Direct crowd control marshals to implement wave-filtering at ticket turnstiles. Adjust dynamic signage guides.';
  }

  return { priority, teamsDispatched, needsEscalation, suggestedResolution };
}

/**
 * Module 3: Wayfinding Navigation Route Describer
 */
export async function generateDirections(startZone, endZone, stadiumGraph = {}) {
  const systemInstruction = `You are a helpful stadium wayfinding AI navigator.
Given a start and target destination, generate clear, natural-language navigation instructions.
Give friendly directions using the stadium's layout context (gates, levels, escalators, food stands).
Keep it concise, clear, and highly readable.
Respond with a JSON object:
{
  "directions": "The natural language directions string",
  "path": Array of strings (the node ids/names of the path, including start and end zones)
}`;

  const prompt = `Start Zone: "${startZone}"
Destination Zone: "${endZone}"
Stadium context summary: Lusail Stadium has Gates A to H on Level 0 (ground). Concourses Level 1 (lower bowl) and Level 2 (upper bowl). Elevators are near Gates C and G. Main Merch Stand is near Gate F. Food Courts are located at Level 1 Concourse East and West.`;

  if (!genAI) {
    return generateMockDirections(startZone, endZone);
  }

  try {
    return await callGeminiJSON(prompt, systemInstruction);
  } catch (err) {
    console.error('[Gemini] generateDirections failed, returning mock.', err.message);
    return generateMockDirections(startZone, endZone);
  }
}

function generateMockDirections(startZone, endZone) {
  // Static pathing mock
  const directions = `From ${startZone}, walk straight along the Concourse corridor. Head past the Merch Stand on your left. Take the escalator up to Level 1, then proceed 40 meters past the Food stalls. You will find ${endZone} directly on your right.`;
  return {
    directions,
    path: [startZone, 'Concourse West', 'Level 1 Escalator', 'Food Court East', endZone]
  };
}

/**
 * Module 4: Grounded Multi-language Fan Assistant Chatbot
 */
export async function runFanChatbot(message, chatHistory = [], venueInfo = {}) {
  if (!genAI) {
    return generateMockFanChatbot(message, venueInfo);
  }

  const systemInstruction = `You are a helpful, official FIFA World Cup 2026 stadium operations virtual assistant.
You MUST:
1. Detect the fan's language automatically and respond fluently in the SAME language.
2. Answer queries ONLY using the stadium venue's real data provided in context. Do not hallucinate match results, schedules, or facts.
3. Be friendly, polite, and helpful to soccer fans.

Venue Grounding Context:
${JSON.stringify(venueInfo, null, 2)}

If the user's question cannot be answered by the context, reply politely that you are only configured to assist with official match-day venue logistics and schedules.`;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction });
    
    // Format chat history
    const contents = [];
    chatHistory.forEach(turn => {
      contents.push({
        role: turn.sender === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }]
      });
    });
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const result = await model.generateContent({ contents });
    return result.response.text().trim();
  } catch (err) {
    console.error('[Gemini] runFanChatbot failed, returning mock.', err.message);
    return generateMockFanChatbot(message, venueInfo);
  }
}

function generateMockFanChatbot(message, venueInfo) {
  const msg = message.toLowerCase();
  
  // Language detection mock
  const isSpanish = msg.includes('hola') || msg.includes('donde') || msg.includes('partido') || msg.includes('estadio');
  const isGerman = msg.includes('hallo') || msg.includes('wo ist') || msg.includes('spiel') || msg.includes('eingang');
  
  let matchesList = [];
  if (venueInfo && venueInfo.schedule) {
    if (Array.isArray(venueInfo.schedule)) {
      matchesList = venueInfo.schedule;
    } else if (venueInfo.schedule.matches && Array.isArray(venueInfo.schedule.matches)) {
      matchesList = venueInfo.schedule.matches;
    }
  }
  
  if (matchesList.length === 0) {
    matchesList = [
      { match: 'Mexico vs Argentina', date: 'June 18, 2026', time: '18:00', gateOpen: '15:00' },
      { match: 'USA vs England', date: 'June 21, 2026', time: '20:00', gateOpen: '17:00' }
    ];
  }

  const normalizedMatches = matchesList.map(m => ({
    match: m.match || m.teams || 'Unknown Match',
    date: m.date || 'TBD',
    time: m.time || 'TBD',
    gateOpen: m.gateOpen || m.gatesOpen || 'TBD'
  }));
  
  if (isSpanish) {
    if (msg.includes('partido') || msg.includes('juego') || msg.includes('calendario')) {
      return `¡Hola! El próximo partido en el estadio es ${normalizedMatches[0].match} el ${normalizedMatches[0].date} a las ${normalizedMatches[0].time}. Las puertas abren a las ${normalizedMatches[0].gateOpen}.`;
    }
    if (msg.includes('baño') || msg.includes('sanitario') || msg.includes('comida') || msg.includes('restaurante')) {
      return `Hola. Las concesiones de comida y los baños principales están ubicados en los pasillos de los niveles 1 y 2. Puedes usar el mapa interactivo para encontrar el más cercano a tu sección.`;
    }
    return `¡Hola! Soy tu asistente de StadiumIQ para la Copa Mundial de la FIFA 2026. ¿En qué puedo ayudarte hoy con respecto al estadio?`;
  }
  
  if (isGerman) {
    if (msg.includes('spiel') || msg.includes('wann') || msg.includes('plan')) {
      return `Hallo! Das nächste Spiel im Stadion ist ${normalizedMatches[0].match} am ${normalizedMatches[0].date} um ${normalizedMatches[0].time} Uhr. Die Tore öffnen um ${normalizedMatches[0].gateOpen} Uhr.`;
    }
    return `Hallo! Ich bin Ihr StadiumIQ-Assistent für die FIFA Fussball-Weltmeisterschaft 2026. Wie kann ich Ihnen heute helfen?`;
  }

  // Default English
  if (msg.includes('match') || msg.includes('game') || msg.includes('schedule') || msg.includes('play')) {
    const matchDetails = normalizedMatches.map(s => `${s.match} on ${s.date} at ${s.time} (Gates open at ${s.gateOpen})`).join('\n- ');
    return `The upcoming match schedule at our stadium is:\n- ${matchDetails}\nIs there anything else I can help you find?`;
  }
  if (msg.includes('gate') || msg.includes('entrance')) {
    return `The stadium gates (A through H) open 3 hours prior to kickoff. Standard bags larger than A4 size are not allowed. Please enter via the gate indicated on your mobile ticket.`;
  }
  if (msg.includes('food') || msg.includes('eat') || msg.includes('drink') || msg.includes('beer') || msg.includes('water')) {
    return `Food and beverage concessions are located on the main concourse levels 1 and 2. High-speed self-checkout kiosks are available at East and West food halls.`;
  }
  
  return `Hello! I am your FIFA World Cup 2026 StadiumIQ Assistant. I can help you with match schedules, gate information, stadium amenities, and safety alerts. What can I do for you today?`;
}
