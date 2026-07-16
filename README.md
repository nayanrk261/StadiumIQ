# StadiumIQ — FIFA World Cup 2026 Smart Stadium Operations

StadiumIQ is a GenAI-enabled Digital Twin Stadium Operations ecosystem built for the **FIFA World Cup 2026** (hosted across **3 countries: US, Canada, and Mexico** in **16 host venues**). 

This dashboard simulates a stadium operations control room (using ** Lusail Stadium / MetLife Stadium** as the active blueprint), integrating real-time telemetry crowd tracking, GenAI crowd bottleneck resolution, an operations dispatch copilot with human-in-the-loop audit trails, neonwaypoint wayfinding navigation, and a grounded multi-language fan chat assistant.

---

## 🏗️ Architecture & Scale Angle: Why GenAI + Digital Twins?

With **48 teams** playing **104 matches** in **16 venues** across **3 nations**, traditional stadium management systems fall short. Traditional venues rely on static, rule-based alerts (e.g., *if Gate A capacity > 80%, flash amber*). 

In a massive multi-venue tournament, static rules are brittle and fail to adapt to live variations:
1. **Diverse Venue Layouts**: 16 separate stadiums have different layouts, gate sizes, and concourse intersections. A ruleset written for MetLife Stadium (NY) will fail at Estadio Azteca (Mexico City). Writing and maintaining 16 distinct rule graphs is an engineering nightmare.
2. **Context-Unaware Alerts**: Brittle rules can't understand *why* a congestion is occurring. Is it a ticket scanner failure? A sudden halftime food rush? A gate fight? 
3. **Multi-language Fan Bases**: Fans from all over the globe require localized logistical assistance.

### The StadiumIQ Solution
By pairing a **real-time Socket.io Digital Twin simulator** with the **Gemini API (gemini-1.5-flash / gemini-2.0-flash)**, StadiumIQ solves these issues:
- **Zero-Brittle Rules**: Gemini interprets live zone densities dynamically on demand, providing customized crowd-control directives based on the layout and active match phase.
- **Root Cause & Directives**: Instead of simple red/green alerts, Gemini explains the *root cause* and suggests a *redirect action for staff* (e.g. *"Divert Gates A-B to Gate C; open emergency Gate E"*) and prints a *ready-to-broadcast fan announcement* in plain language.
- **Human-in-the-Loop Safeguards**: AI suggestions are presented as recommendation drafts. Operators can approve them or override them with manual adjustments. Every decision is saved into an **Audit Trail**—crucial for security compliance.
- **RAG-lite Grounded Fan Chat**: The fan chatbot answers queries in any language, grounding answers in venue schedules, gate regulations, and live alerts, preventing hallucinations.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite) styled with **premium, responsive Vanilla CSS** (Dark mode, glassmorphic panels, glowing neon overlays, alert-pulsing cards, and custom typography using the *Outfit* Google Font).
- **Backend**: Node.js + Express (configured with ES modules `"type": "module"`).
- **Real-Time Feed**: Socket.io (for real-time crowd telemetry broadcasts).
- **Database**: MongoDB + Mongoose. 
  * *Zero-Config Fallback*: If no `MONGO_URI` is supplied, StadiumIQ automatically falls back to an **in-memory/file-based Mock Mongoose engine** that persists data in `server/data/*.json`. The app is plug-and-play for evaluation.
- **GenAI Reasoning**: Google Gemini API via `@google/generative-ai`.
  * *Offline Fallback*: If `GEMINI_API_KEY` is missing, the backend defaults to a local mock AI reasoning engine, so all modules remain interactive and testable offline.
- **Testing**: Vitest + Supertest for robust unit and integration testing.

---

## 🚀 Setup & Execution

### Prerequisite Environment
- Node.js (v18+)
- npm

### 1. Installation
Run the following command at the root of the workspace to install all dependencies for the root, server, and client concurrently:
```bash
npm run install-all
```

### 2. Configure Environment Keys
Navigate to the `server/` directory and check the `.env` file. You can insert your credentials:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/stadiumiq
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```
*Note: If MongoDB is not running locally, or if you don't supply a Gemini API Key, the system will use local fallbacks. It runs immediately without these keys.*

### 3. Run the Ecosystem
Launch both the backend and client concurrently by executing this command at the root:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to access the control panel.

### 4. Running Automated Tests
Run the Vitest integration and unit tests:
```bash
npm run test
```

---

## 📱 Grounded Features Walkthrough

### Module 1: Digital Twin Simulator & Heatmap
- Renders an interactive, color-coded SVG stadium map (Gates, Concourses, and Sections).
- Zones transition between **Normal (Green)**, **Warning (Amber)**, and **Danger (Red)** based on live density.
- Operators can speed up and toggle the **Match Stage** (Pre-Match, Halftime Concourse Rush, Post-Match Evacuation) from the top bar to observe how crowd flow alters in real time.
- Clicking any warning/danger zone opens a panel displaying Gemini's **Crowd Safety Recommendation** (Risk analysis, Root cause, Operational redirect action, Fan announcement).

### Module 2: Control Room Copilot
- Type free-text incident reports: *"Fight breaking out near section 112, medical attention needed at Gate F."*
- Gemini parses and classifies the incident, assigning a priority (Low, Medium, High, Critical), recommending dispatch teams (Medical, Security, etc.), and suggesting a response strategy.
- **Human-in-the-Loop Audit**: Operators can click **Accept Dispatch** or **Override Triage** (allowing manual overrides for priority levels, team dispatches, and operator justification notes). Every action is logged into the audit log history.

### Module 3: Wayfinding Navigation
- Select a current zone and target destination.
- Gemini computes the path and returns natural-language instructions (*"Head past Gate F, take the stairs near the Merch Stand..."*).
- The map overlays the generated waypoint path as a **neon cyan glowing dashed line**, illustrating route logistics.

### Module 4: Multi-language Fan Assistant
- Grounded in local venueInfo schedules, gate mappings, and active congestion warnings.
- Automatically translates input and responds in the same language. Try asking questions in Spanish (*"¿a qué hora es el partido de México?"*) or German (*"Wo sind die Toiletten?"*).
- Live alerts are factored in: the bot warns fans about overcrowded zones in real time.
