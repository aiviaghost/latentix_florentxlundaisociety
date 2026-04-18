# Latentix — AI Synthetic Market Simulator

> **Hackathon Project**: Generate AI societies and simulate how startup ideas spread through social networks

Inspired by [Artificial Societies (YC W25)](https://www.artificialsocieties.com/), Latentix builds dynamic AI personas from real-world data (LinkedIn profiles or text descriptions), visualizes them as an immersive 3D social network, and simulates how your startup idea propagates through that society — showing you exactly who adopts, who objects, and why.

## 🎯 The Product

### Two-Phase Demo Flow

**Phase 1: Build Your Society (30 seconds)**
- Describe your target audience OR paste LinkedIn URLs
- Watch a 3D galaxy of AI personas materialize
- Each node is a unique persona with behavioral traits

**Phase 2: Test Your Idea (30 seconds)**
- Paste your startup pitch
- See personas react in real time in the console, with the graph tinting by sentiment
- Click nodes to focus a persona; final headline, narrative, and metrics arrive with the stream summary

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** (fast dev environment)
- **Tailwind CSS** (styling)
- **react-force-graph-3d** (3D network visualization)
- **Three.js** (custom node rendering)

### Backend
- **Node.js** + **Express** (API server)
- **Anthropic Claude** (Haiku for persona synthesis, Sonnet for simulation)
- **Proxycurl API** (optional: LinkedIn data fetching)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Anthropic API key ([get one here](https://console.anthropic.com/))
- (Optional) Proxycurl API key for LinkedIn import ([free tier here](https://nubela.co/proxycurl/))

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for root, client, and server simultaneously (monorepo setup).

### 2. Configure Environment

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
PROXYCURL_API_KEY=your_key_here  # Optional
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

Start both frontend and backend:
```bash
npm run dev
```

This runs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 4. Open the App

Navigate to http://localhost:5173 and start building societies!

## 📂 Project Structure

```
latentix/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SocietyGraph.jsx      # 3D force graph (Person A)
│   │   │   ├── CreatePanel.jsx       # Society creation UI (Person C)
│   │   │   ├── SimulationPanel.jsx   # Simulation controls (Person C)
│   │   │   ├── ResultsPanel.jsx      # Metrics display (Person C)
│   │   │   ├── PersonaDetail.jsx     # Node detail popup (Person C)
│   │   │   └── ActivityFeed.jsx      # Live activity log (Person C)
│   │   ├── hooks/
│   │   │   ├── useSociety.js         # Society state management
│   │   │   └── useSimulation.js      # Simulation state management
│   │   ├── api/
│   │   │   └── client.js             # API contract (shared by all)
│   │   └── App.jsx                   # Main app layout
│   └── package.json
│
├── server/                    # Backend (Node.js + Express)
│   ├── routes/
│   │   ├── society.js                # POST /api/society/generate
│   │   └── simulate.js               # POST /api/simulate
│   ├── services/
│   │   ├── societyGenerator.js       # Main society generation (Person B)
│   │   ├── personaSynthesis.js       # LLM persona synthesis (Person D)
│   │   ├── graphAssembly.js          # Network topology builder (Person B)
│   │   ├── simulationEngine.js       # Multi-agent simulation (Person B)
│   │   └── linkedinFetcher.js        # Proxycurl integration (Person D)
│   ├── prompts/
│   │   ├── personaSynthesis.js       # LLM prompts (Person D)
│   │   └── simulationStep.js         # Simulation prompts (Person D)
│   ├── utils/
│   │   └── anthropic.js              # Claude API client
│   ├── data/
│   │   └── cachedProfiles.json       # Fallback LinkedIn data
│   └── index.js                      # Express server entry
│
└── package.json                      # Root workspace config
```

## 👥 Team Roles & Parallelization

The project is structured for **4 people** to work independently:

### **Person A: 3D Graph Lead**
**Focus**: `client/src/components/SocietyGraph.jsx`

**Tasks**:
- Custom THREE.js node rendering (spheres with glow effects)
- Node color states during simulation (green/red/yellow)
- Link particle system (information flow animation)
- Camera animation (auto-follow during simulation)
- Text sprites for persona names

**Can start immediately with**: Mock data in `SocietyGraph.jsx`

---

### **Person B: Backend Lead**
**Focus**: `server/routes/*`, `server/services/simulationEngine.js`, `server/services/graphAssembly.js`

**Tasks**:
- API endpoints (`/api/society/generate`, `/api/simulate`)
- Society generation pipeline
- Simulation engine (multi-step propagation)
- Graph assembly algorithm
- Error handling and API optimization

**Depends on**: Anthropic API key, Person D's prompts (can use placeholders initially)

---

### **Person C: Frontend/UX Lead**
**Focus**: `client/src/components/*` (except `SocietyGraph.jsx`)

**Tasks**:
- All UI panels (Create, Simulation, Results, PersonaDetail, ActivityFeed)
- Layout and responsive design
- Loading states and animations
- Results visualization (bars, counters, quotes)
- React hooks (`useSociety.js`, `useSimulation.js`)

**Can start immediately with**: Mock API responses from `client/src/api/client.js`

---

### **Person D: Data + Prompts Lead**
**Focus**: `server/prompts/*`, `server/services/linkedinFetcher.js`, `server/services/personaSynthesis.js`

**Tasks**:
- Write all LLM prompts (society generation, persona synthesis, simulation)
- Proxycurl API integration
- LinkedIn persona transformation logic
- Test and refine prompts until output quality is high
- Create cached profile data

**Can start immediately**: Write prompts in `server/prompts/` files

---

## 🔌 API Documentation

### POST `/api/society/generate`

Generate a society of AI personas.

**Request Body**:
```json
{
  "mode": "describe",
  "description": "50 European B2B SaaS founders, mixed early and growth stage",
  "persona_count": 30
}
```

OR for LinkedIn mode:
```json
{
  "mode": "linkedin",
  "linkedin_urls": [
    "https://linkedin.com/in/username1",
    "https://linkedin.com/in/username2"
  ],
  "persona_count": 30,
  "supplement_count": 25
}
```

**Response**:
```json
{
  "society_id": "soc_abc123",
  "nodes": [
    {
      "id": "p_1",
      "name": "Maria C.",
      "archetype": "Product Leader",
      "val": 8,
      "color": "#8b5cf6",
      "traits": { ... },
      ...
    }
  ],
  "links": [
    { "source": "p_1", "target": "p_2", "strength": 0.6 }
  ],
  "metadata": {
    "total_personas": 30,
    "real_profiles": 5,
    "generated_profiles": 25
  }
}
```

---

### POST `/api/society/search`

Builds a society from a natural-language audience description. Returns **`text/event-stream`**: each line is `data: { "type": "...", ... }\n\n` (see `docs/SOCIETY_BUILDER_SIMULATION_FLOW.md`). The client buffers the stream and resolves with `{ society_id, nodes, links, metadata }`.

### POST `/api/simulate/personas-stream`

Streams **per-persona** reactions (Claude via `respondAsPersona`) with bounded concurrency, then a **`summary`** object (headline, narrative, quotes, metrics). The React app uses this as the primary simulation path.

### POST `/api/simulate`

Run a **single-shot** summary on a society (fallback if the persona stream fails).

**Request Body**:
```json
{
  "society_id": "soc_abc123",
  "content": "An AI tool that generates financial reports from raw data. $49/month for startups.",
  "seed_strategy": "auto"
}
```

**Response**:
```json
{
  "steps": [
    {
      "step": 1,
      "reactions": [
        {
          "agent_id": "p_1",
          "reaction": "positive",
          "action": "share",
          "sentiment_score": 0.8,
          "quote": "Love the concept but need SOC 2.",
          "would_share": true,
          "influenced_by": null
        }
      ]
    }
  ],
  "summary": {
    "adoption_rate": 0.62,
    "positive_count": 18,
    "negative_count": 5,
    "neutral_count": 7,
    "top_quotes": [...]
  }
}
```

---

## 🧪 Testing the Full Flow

1. **Generate a Society**:
   ```bash
   curl -X POST http://localhost:3001/api/society/generate \
     -H "Content-Type: application/json" \
     -d '{
       "mode": "describe",
       "description": "Tech founders and product leaders in SaaS",
       "persona_count": 20
     }'
   ```

2. **Run a Simulation** (use the `society_id` from step 1):
   ```bash
   curl -X POST http://localhost:3001/api/simulate \
     -H "Content-Type: application/json" \
     -d '{
       "society_id": "soc_xyz",
       "content": "A developer tool for API testing",
       "seed_strategy": "auto"
     }'
   ```

## 🎨 Visual Design Notes

- **Color Theme**: Dark mode (`bg-slate-950`) with gradient accents (purple to blue)
- **3D Background**: Deep space black (`#050510`)
- **Active States**: Glow effects using `emissive` in Three.js
- **Particles**: Blue particles (`#60a5fa`) flowing along edges during simulation
- **Glass Morphism**: Panels use backdrop blur with translucent backgrounds

## 📋 Implementation Checklist

### Must Have (Core Demo)
- [x] Society generation from description
- [x] 3D force graph rendering
- [x] Simulation with step-by-step results
- [ ] Particle animation on edges
- [ ] Node color changes during simulation
- [ ] Results panel with adoption metrics

### Nice to Have (If Time)
- [ ] LinkedIn URL import
- [ ] Click node for detail panel
- [ ] Camera auto-zoom to active nodes
- [ ] Activity feed with live reactions
- [ ] "Try another idea" flow

### Do NOT Build
- ❌ User authentication
- ❌ Database persistence
- ❌ WebSocket streaming
- ❌ A/B testing features
- ❌ File upload for pitch decks

## 🔥 Tips for Success

1. **Start with the API contract**: `client/src/api/client.js` defines everything. Frontend and backend can work independently once this is agreed upon.

2. **Use mock data early**: Both frontend and backend have fallbacks. Don't wait for real data to start building.

3. **Test the 3D graph first**: Person A should get a basic rotating galaxy working in the first hour. Visual wow factor is critical.

4. **Prompt quality matters**: Person D should iterate on prompts with real Claude API calls before integrating. Use the [Anthropic Console](https://console.anthropic.com/workbench) to test prompts.

5. **Parallel development**:
   - Frontend can mock API responses
   - Backend can return mock data initially
   - Person A can work with hardcoded graph data
   - Person D can test prompts independently

6. **Merge often**: Since everyone works on different files, merge conflicts should be minimal. Push frequently.

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Frontend can't reach backend
- Check that backend is running on port 3001
- Check CORS settings in `server/index.js`
- Verify Vite proxy config in `client/vite.config.js`

### LLM returning invalid JSON
- Check prompts in `server/prompts/`
- Add better error handling in `server/utils/anthropic.js`
- Use fallback mock data for demos

### 3D graph not rendering
- Check browser console for Three.js errors
- Verify `react-force-graph-3d` is installed
- Ensure graph data has valid `nodes` and `links` arrays

## 📚 Resources

- [Artificial Societies (inspiration)](https://www.artificialsocieties.com/)
- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [react-force-graph-3d Docs](https://github.com/vasturiano/react-force-graph)
- [Three.js Docs](https://threejs.org/docs/)
- [Proxycurl API Docs](https://nubela.co/proxycurl/docs)

## 📝 License

MIT (Hackathon project)

---

**Built for hackathon by a team of 4 in ~10 hours**

Good luck! 🚀
