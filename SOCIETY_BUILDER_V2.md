# Society Builder V2 - Simplified LinkedIn-First Pipeline ✨

## What Changed

We've **completely redesigned** the Society Builder to align with your backend's LinkedIn scraping approach. The result is a cleaner, more intuitive pipeline that visualizes the real-time data ingestion process.

---

## 🎯 New User Flow

### Before (V1)
```
Choose mode (tabs) → Enter description OR paste URLs → Set persona count (slider) → Generate
  ↓
Static pipeline with fake progress
  ↓
Final result
```

### After (V2)
```
Enter search query (one input) → Search LinkedIn
  ↓
Real-time pipeline shows:
  - LinkedIn profiles appearing one-by-one
  - Each profile → 1 persona (visible 1:1 mapping)
  - Graph assembly building connections
  ↓
3D network ready to explore
```

---

## 📁 New File Structure

```
client/src/components/
├── SearchInput.jsx                    # NEW: Simplified entry point
├── SocietyBuilderView.jsx             # REFACTORED: New flow
├── pipeline/
│   ├── DynamicPipeline.jsx            # NEW: Dynamic node rendering
│   ├── ProfileNode.jsx                # NEW: LinkedIn profile cards
│   ├── PersonaNode.jsx                # NEW: Synthesized persona cards
│   ├── SourceNode.jsx                 # EXISTING: Data sources
│   ├── ProcessingNode.jsx             # EXISTING: LLM operations
│   └── OutputNode.jsx                 # EXISTING: Final results

client/src/hooks/
├── usePipelineUpdates.js              # NEW: Real-time data streaming
└── useSociety.js                      # DEPRECATED: Use usePipelineUpdates

client/src/api/
└── client.js                          # UPDATED: New endpoints added
```

### Deprecated/Removed
- ❌ `DataSourceConfig.jsx` (too complex, replaced with SearchInput)
- ❌ `PipelineFlow.jsx` (static, replaced with DynamicPipeline)
- ⚠️ `useSociety.js` (kept for legacy, but not used in new flow)

---

## 🔌 Backend Integration

### New API Endpoints (Required)

#### 1. **POST `/api/society/search`**
Start a new society generation from a search query.

**Request:**
```json
{
  "query": "European B2B SaaS founders, 25-40 years old, tech-heavy"
}
```

**Response:**
```json
{
  "society_id": "soc_abc123",
  "status": "processing",
  "message": "Searching LinkedIn..."
}
```

---

#### 2. **WebSocket `/api/society/stream/:society_id`** (Preferred)
Real-time updates as the pipeline progresses.

**Events:**
```javascript
// Profile found
{
  "type": "profile_found",
  "profile": {
    "id": "prof_1",
    "name": "Sarah Johnson",
    "title": "VP Product @ Stripe",
    "company": "Stripe",
    "location": "San Francisco, CA",
    "skills": ["Product Strategy", "API Design"],
    "status": "found"
  }
}

// Profile scraped (full data retrieved)
{
  "type": "profile_scraped",
  "profile": {
    "id": "prof_1",
    // ... complete profile data
    "status": "scraped"
  }
}

// Persona synthesis started
{
  "type": "persona_synthesizing",
  "profileId": "prof_1",
  "persona": {
    "id": "persona_1",
    "name": "Sarah J.",
    "status": "synthesizing"
  }
}

// Persona synthesis complete
{
  "type": "persona_complete",
  "persona": {
    "id": "persona_1",
    "name": "Sarah J.",
    "archetype": "Product Leader",
    "role": "VP Product",
    "company_type": "enterprise",
    "color": "#8b5cf6",
    "traits": {
      "risk_tolerance": 0.6,
      "innovation_openness": 0.8,
      "social_influence": 0.7,
      "domain_expertise": ["product-strategy", "api-design"]
    },
    "status": "ready"
  }
}

// Graph assembly progress
{
  "type": "graph_progress",
  "message": "Building connections...",
  "connectionsBuilt": 45,
  "totalConnections": 120
}

// Graph complete
{
  "type": "graph_complete",
  "clusters": ["tech-founders", "product-leaders", "investors"],
  "nodes": [...],  // Full persona array
  "links": [...]   // Connection array
}
```

---

#### 3. **GET `/api/society/:society_id/status`** (Polling Fallback)
For environments without WebSocket support.

**Response:**
```json
{
  "society_id": "soc_abc123",
  "status": "processing" | "complete",
  "profiles": [
    {
      "id": "prof_1",
      "name": "Sarah Johnson",
      "title": "VP Product @ Stripe",
      "status": "scraped"
    }
  ],
  "personas": [
    {
      "id": "persona_1",
      "name": "Sarah J.",
      "archetype": "Product Leader",
      "status": "ready"
    }
  ],
  "graphState": {
    "status": "processing",
    "connectionsBuilt": 45,
    "totalConnections": 120
  }
}
```

---

## 🎨 Frontend Features

### 1. **Simplified Search Input**
- Single textarea for natural language query
- No mode switching, no sliders
- Clear "How it works" explanation
- Word count indicator

### 2. **Dynamic Pipeline Visualization**
The pipeline **builds itself** as data comes in:

```
[Query] → [LinkedIn Scraper] → [Profile 1] → [Persona 1] ↘
                                [Profile 2] → [Persona 2] → [Graph Assembly] → [3D Network]
                                [Profile 3] → [Persona 3] ↗
```

**Features:**
- Profiles appear incrementally (not all at once)
- 1:1 visual mapping from profile to persona
- Animated edges show data flow
- Auto-layout with vertical stacking

### 3. **Real-Time Status Card**
Floating overlay shows live metrics:
- Profiles found: `X`
- Personas synthesized: `Y`
- Connections built: `Z`
- Active/Complete status

### 4. **Custom Node Types**

**ProfileNode:**
- Avatar (from LinkedIn or icon)
- Name + title
- Company + location
- Skills preview (top 3)
- Status badge (found/scraped)

**PersonaNode:**
- Color-coded avatar
- Name + archetype
- Role + company type
- Key traits (progress bars)
- Domain expertise tags
- Status badge (synthesizing/ready)

### 5. **Completion State**
When finished:
- Success card with detected clusters
- "View 3D Network" button (ready for next phase)
- Pipeline remains visible (can scroll through)

---

## 🚀 How to Run

### 1. Start Frontend
```bash
cd client
npm run dev
```

Open http://localhost:5173

### 2. Start Backend (with WebSocket support)
```bash
cd server
npm run dev
```

Backend should be on http://localhost:3001

---

## 🧪 Testing Without Backend

The frontend includes a **robust fallback system**:

1. **WebSocket not available** → Automatically falls back to polling
2. **Polling fails** → Shows loading state, waits for data
3. **No data comes** → Shows "Searching LinkedIn..." indefinitely

To test the UI without a working backend:
- The search will fail gracefully
- You can add mock data to `usePipelineUpdates` to simulate the flow

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  SearchInput ──(query)──> App ──> SocietyBuilderView        │
│                             │                                │
│                             ├──> usePipelineUpdates          │
│                             │    (WebSocket listener)        │
│                             │                                │
│                             └──> DynamicPipeline             │
│                                  (renders nodes dynamically) │
└─────────────────────────────────────────────────────────────┘
                              ↕
                        WebSocket / HTTP
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                                                              │
│  POST /society/search                                        │
│    ↓                                                         │
│  LinkedIn Scraper ──(profile_found)──> WebSocket            │
│    ↓                                                         │
│  Profile Scraper ──(profile_scraped)──> WebSocket           │
│    ↓                                                         │
│  LLM Persona Synthesis ──(persona_complete)──> WebSocket    │
│    ↓                                                         │
│  Graph Assembly ──(graph_complete)──> WebSocket             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Decisions

### Why Remove Persona Count Slider?
**Old way:** User sets count, backend tries to match
**New way:** Backend finds as many relevant profiles as possible, frontend shows them all

**Benefit:** More natural, less artificial constraints

### Why Remove "Describe" vs "LinkedIn" Tabs?
**Old way:** Two separate flows
**New way:** One flow - backend always scrapes LinkedIn based on the query

**Benefit:** Simpler UX, aligns with backend architecture

### Why Dynamic Pipeline Instead of Static?
**Old way:** Hardcoded nodes, simulated progress
**New way:** Nodes appear as data arrives, real progress

**Benefit:** Honest visualization of what's actually happening

### Why 1:1 Profile → Persona Mapping?
**Old way:** Hidden synthesis process
**New way:** Visual connection from source to result

**Benefit:** Transparency, educational, impressive to watch

---

## 🔧 Customization Guide

### Change Pipeline Layout
Edit `DynamicPipeline.jsx`:
```javascript
const COLS = {
  query: 50,        // X position of query node
  scraper: 350,     // X position of scraper
  profiles: 650,    // X position of profile column
  personas: 1000,   // X position of persona column
  graph: 1350,      // X position of graph assembly
  output: 1700,     // X position of output
}

const ROW_HEIGHT = 150  // Vertical spacing between profiles/personas
```

### Customize Node Appearance
Edit `ProfileNode.jsx` or `PersonaNode.jsx`:
- Card styling
- Badge colors
- Layout/spacing
- Content shown

### Add More Real-Time Metrics
Edit `SocietyBuilderView.jsx`:
```javascript
<div className="flex justify-between text-xs">
  <span>Your Metric</span>
  <span className="font-mono">{yourValue}</span>
</div>
```

### Change Colors/Status Indicators
Edit node components:
```javascript
const statusColors = {
  idle: 'bg-muted/50 border-muted',
  processing: 'bg-amber-500/10 border-amber-500/50',
  complete: 'bg-green-500/10 border-green-500/50',
  error: 'bg-red-500/10 border-red-500/50',
}
```

---

## 🐛 Troubleshooting

### Profiles Not Appearing
- Check WebSocket connection in browser DevTools → Network → WS
- Verify backend is sending `profile_found` events
- Check `usePipelineUpdates` is receiving messages

### Pipeline Layout Broken
- Check that all nodes have valid `position: { x, y }`
- Verify edge `source` and `target` IDs match node IDs
- Try adjusting `COLS` values in `DynamicPipeline.jsx`

### WebSocket Not Connecting
- Ensure backend WebSocket server is running
- Check `VITE_WS_URL` environment variable
- Fallback to polling should happen automatically

### Nodes Overlapping
- Increase `ROW_HEIGHT` in `DynamicPipeline.jsx`
- Adjust column positions (`COLS`)
- Consider virtualization for 30+ profiles

---

## 📈 Performance Considerations

### Many Profiles (30+)
The current implementation renders all nodes. For better performance with many profiles:

1. **Virtualize the list**: Only render visible nodes
2. **Collapse older nodes**: Show count badge instead
3. **Lazy load**: Show first 10, "Load more" button

### Animations
- Fade-in animation is already optimized (CSS-based)
- Edge animations use React Flow's built-in system
- No custom JS animations needed

---

## 🎉 What's Next?

### Phase 2: 3D Network View
When "View 3D Network" is clicked:
1. Fade out React Flow pipeline
2. Fade in 3D force graph (react-force-graph-3d)
3. Show personas as nodes, connections as edges
4. Enable rotation, zoom, node selection
5. Add "Back to Pipeline" button

### WebSocket Improvements
- Reconnection logic
- Message queuing during disconnects
- Progress persistence (resume if page reloads)

### Enhanced Visualizations
- Cluster highlighting during assembly
- Profile thumbnails (avatars)
- Hover tooltips with full details
- Export pipeline as image

---

## 📚 Related Documentation

- [Original Frontend Redesign](./FRONTEND_REDESIGN.md)
- [Backend API Contract](./client/src/api/client.js)
- [React Flow Docs](https://reactflow.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**This redesign makes the Society Builder production-ready for real-time LinkedIn scraping integration!** 🚀

Your backend team can now implement the WebSocket events, and everything will flow seamlessly into the pipeline visualization.
