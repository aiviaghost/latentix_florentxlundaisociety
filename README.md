# Pollen

Synthetic audience lab: describe a target market, watch a society of AI personas form as a 3D network, then stress-test a pitch or product idea and read how the group reacts—in real time and in aggregate.
---

## Problem statement

Teams and founders need fast, cheap feedback on how an idea might land with a *specific* audience—not a single generic LLM reply, but many plausible viewpoints that reflect different roles, incentives, and skepticism. Manual panels and surveys are slow; a single chatbot answer hides disagreement and network effects. There is no lightweight way to go from “European B2B SaaS buyers” to dozens of consistent personas *and* an interactive read on adoption, objections, and quotes.

---

## Solution

**Pollen** is a two-phase web app:

1. **Build** — You describe an audience in natural language (and optional size). The backend matches stored profiles, synthesizes personas, and assembles a graph. The UI shows a **builder pipeline** (React Flow) and, when the graph is ready, a **3D force-directed network** of personas.

2. **Simulate** — You submit a pitch or scenario. The backend streams **per-persona** reactions (sentiment, reaction label, quote); the **3D graph** tints nodes by sentiment, and the **simulation console** shows live rows plus a final **summary** (headline, narrative, metrics, quotes).

Inspired by the idea of [Artificial Societies](https://www.artificialsocieties.com/); this repo is a hackathon-scope implementation focused on demo quality and a clear API surface.

---

## Technical approach

### Architecture

- **Monorepo** (npm workspaces): `client/` (Vite + React), `server/` (Express), root scripts to run both.
- **Society build** — `POST /api/society/search` returns **Server-Sent Events (SSE)**: profile discovery, persona synthesis steps, graph progress, then `graph_complete` with `nodes` / `links`. The client [`usePipelineUpdates`](client/src/hooks/usePipelineUpdates.js) maps events into pipeline + graph state.
- **Simulation** — Primary path: **`POST /api/simulate/personas-stream`** (SSE): persona chunks with bounded concurrency, then a `summary` payload. Fallback: **`POST /api/simulate`** for a one-shot result. Conversation context for follow-up rounds is built in [`simulationConversation.js`](client/src/lib/simulationConversation.js).

### Frontend

- **React 18**, **Vite**, **Tailwind CSS**, **shadcn-style UI** primitives.
- **react-force-graph-3d** (+ Three.js) for the society graph during simulation; node color driven by streamed sentiment.
- **React Flow** for the builder “pipeline” diagram (query → index → profiles → personas → graph → output).
- **Axios / `fetch`** in [`client/src/api/client.js`](client/src/api/client.js) for HTTP + SSE consumption ([`sseReader.js`](client/src/lib/sseReader.js)).

### Backend

- **Node.js**, **Express**, **CORS** scoped to `CLIENT_URL`.
- **Anthropic Claude** via [`server/utils/anthropic.js`](server/utils/anthropic.js) for persona synthesis and simulation steps; prompts under [`server/prompts/`](server/prompts/).
- **Embedding-assisted profile search** (see [`server/services/profileSearch.js`](server/services/profileSearch.js) and optional precomputed embeddings in `server/data/`).
- Optional **Gemini** key in `.env` if your deployment uses Google models anywhere in the stack—see `.env.example`.

### Deep dive

For event types, route list, and client/server contract details, see **[`docs/SOCIETY_BUILDER_SIMULATION_FLOW.md`](docs/SOCIETY_BUILDER_SIMULATION_FLOW.md)**.

---

## How to run the project

### Prerequisites

- **Node.js 18+** and **npm**
- **Anthropic API key** ([Anthropic Console](https://console.anthropic.com/))

### 1. Install

From the repository root:

```bash
npm install
```

Installs root, `client`, and `server` workspaces.

### 2. Environment

```bash
cp .env.example .env
```

Edit **`.env`** at the repo root (the server loads `../.env` relative to `server/`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | **Yes** | Persona synthesis and simulation |
| `PORT` | No (default `3001`) | API port |
| `CLIENT_URL` | No | CORS origin (default `http://localhost:5173`) |
| `VITE_PIPELINE_LIVE` | No | When `true`, builder applies society search SSE live |
| `GEMINI_API_KEY` | Yes | For embedding generation |
| `VITE_API_URL` | No | Override API base (default `/api` via Vite proxy) |

### 3. Development

```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)  
- **Backend:** [http://localhost:3001](http://localhost:3001)  
- **Health:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

### 4. Production build (client)

```bash
npm run build --workspace=client
```

Output in `client/dist/`. Serve static files and reverse-proxy `/api` to the Node server as needed.

---

## Project layout (abbreviated)

```
├── client/                 # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── components/     # SocietyBuilderView, SimulationView, SocietyGraph, DynamicPipeline, …
│   │   ├── hooks/
│   │   └── lib/
│   └── vite.config.js
├── server/                 # Express API
│   ├── index.js
│   ├── routes/             # society, simulate, simulate/stream, simulate/personas-stream, persona
│   ├── services/         # graphAssembly, personaSynthesis, simulationStreamEngine, …
│   ├── prompts/
│   └── data/
├── docs/
│   └── SOCIETY_BUILDER_SIMULATION_FLOW.md
├── .env.example
└── package.json            # workspaces: client, server
```

---

## API surface (short)

| Method | Path | Role |
|--------|------|------|
| POST | `/api/society/search` | SSE: build society from natural-language query |
| POST | `/api/simulate/personas-stream` | SSE: stream persona reactions + summary |
| POST | `/api/simulate` | JSON: one-shot simulation (fallback) |
| GET | `/api/health` | Liveness + config sanity |

Full shapes and stream record types: [`docs/SOCIETY_BUILDER_SIMULATION_FLOW.md`](docs/SOCIETY_BUILDER_SIMULATION_FLOW.md).

---

## Troubleshooting

- **Blank UI / CORS** — Ensure `npm run dev` started the server and `CLIENT_URL` matches the Vite origin.
- **No LLM output** — Confirm `ANTHROPIC_API_KEY` in `.env` at repo root; hit `/api/health`.
- **3D graph empty** — Check browser console; ensure `graph_complete` delivered `nodes` (see network tab on `/api/society/search`).

---

## License

MIT — hackathon / educational use.
