# AI Synthetic Market Simulator — Battle Plan v2 (REFINED)

> **Team:** 4 people · **Build time:** ~10 hours · **Theme:** "Build Your Next Startup"
> **Inspired by:** Artificial Societies (YC W25) — but our own take

---

## WHAT CHANGED FROM V1

| Area | V1 (Old) | V2 (New) | Why |
|------|----------|----------|-----|
| Personas | 18 hardcoded archetypes | Dynamic generation pipeline from real public data | Scalable, startup-worthy, much more impressive to judges |
| Visualization | React Flow (2D) | `react-force-graph-3d` (3D WebGL) | Massive wow factor, what hackathon winners use, fits the "society" metaphor |
| Data source | None — all fictional | LinkedIn/X-style public data → LLM persona synthesis | Grounds personas in reality, mirrors Artificial Societies' approach |
| Pitch angle | "Test your idea" | "Simulate your audience — built from real people" | Stronger startup narrative, clearer differentiation |

---

## 1. REFINED PRODUCT CONCEPT

### The Elevator Pitch (NEW)
> "Paste a LinkedIn URL or describe your target audience. We scrape public data, build a 3D social network of AI personas grounded in real human behavior, and simulate how your startup idea spreads through that network — in 30 seconds."

### Why This Is Now Startup-Worthy
Artificial Societies raised €4.5M doing exactly this: building personas from LinkedIn/X data and simulating network dynamics. They have 500K+ personas built from individual-level behavioral data. We're building a focused hackathon version of the same thesis — and the fact that a YC company just raised for this validates the market.

**Our demo angle:** We don't just simulate generic archetypes. We build personas from *real public profiles* and show you the actual network dynamics in an immersive 3D graph.

---

## 2. DYNAMIC PERSONA GENERATION PIPELINE

### The Pipeline (3 Stages)

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  DATA INGESTION  │────→│  PERSONA SYNTH   │────→│  GRAPH ASSEMBLY  │
│                  │     │                  │     │                  │
│  Sources:        │     │  LLM transforms  │     │  Build network   │
│  - Proxycurl API │     │  raw profiles    │     │  topology from   │
│  - Twitter/X API │     │  into structured  │     │  persona traits  │
│  - Manual desc.  │     │  agent specs     │     │  + clustering    │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

### Stage 1: Data Ingestion

**For the hackathon, support TWO input modes:**

#### Mode A: "Describe Your Audience" (Fast, no scraping needed)
User types: *"50 European B2B SaaS founders, mixed early and growth stage, tech-heavy"*

The LLM generates a diverse set of 20-40 personas matching this description, with realistic variance in traits.

#### Mode B: "Import from LinkedIn" (The impressive path)
User provides LinkedIn profile URLs or a company page. We use **Proxycurl API** (legitimate, court-tested, has free trial credits) to pull public profile data:

```json
// Proxycurl response (simplified)
{
  "full_name": "Maria Chen",
  "headline": "VP Product @ Stripe | Ex-Google | Angel Investor",
  "summary": "15 years building fintech products...",
  "experiences": [
    { "title": "VP Product", "company": "Stripe", "duration": "3 years" }
  ],
  "education": [{ "school": "Stanford", "degree": "MS CS" }],
  "skills": ["Product Strategy", "Fintech", "API Design"],
  "connections": 2400
}
```

**Hackathon-realistic approach:** Use Proxycurl's free tier (10 credits) to demo 5-10 real profiles live, then supplement with LLM-generated personas that "fill in" the network to 30-40 total nodes. This hybrid approach is honest and demo-friendly.

**Fallback if API fails:** Pre-fetch 10-15 profiles before the demo as cached JSON. The pipeline still runs — it just reads from cache.

### Stage 2: Persona Synthesis (LLM)

Take raw profile data and synthesize a simulation-ready persona:

```
PROMPT:
You are building an AI persona for a market simulation. Given this public
LinkedIn profile data, create a detailed behavioral profile.

Profile:
{raw_profile_json}

Return a JSON object:
{
  "id": "persona_maria_chen",
  "display_name": "Maria C.",
  "archetype": "Product-Minded Investor",
  "avatar_color": "#8b5cf6",
  "role_summary": "VP Product at major fintech, angel investor on the side",
  "traits": {
    "risk_tolerance": 0.6,
    "price_sensitivity": 0.3,
    "innovation_openness": 0.8,
    "social_influence": 0.7,
    "tech_savviness": 0.9,
    "domain_expertise": ["fintech", "api-platforms", "product-led-growth"]
  },
  "behavioral_profile": "Makes investment decisions based on product quality
    and team execution. Values clean API design and developer experience.
    Skeptical of marketing-heavy pitches without technical depth. When
    convinced, shares actively within her network.",
  "likely_connections": ["other fintech people", "product leaders", "founders"],
  "influence_radius": 5
}
```

### Stage 3: Graph Assembly

Once we have 20-40 personas, build the network:

```javascript
function assembleGraph(personas) {
  const nodes = personas.map(p => ({
    id: p.id,
    name: p.display_name,
    val: p.traits.social_influence * 10, // node size = influence
    color: p.avatar_color,
    archetype: p.archetype,
    ...p
  }));

  const links = [];

  // Connection logic:
  // 1. Domain overlap → strong connection
  // 2. Role similarity → moderate connection
  // 3. Influence proximity → weak connection
  // 4. Random bridges (small-world property)

  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      const overlap = domainOverlap(personas[i], personas[j]);
      const roleSim = roleSimilarity(personas[i], personas[j]);
      const connectionProb = overlap * 0.5 + roleSim * 0.3 + Math.random() * 0.2;

      if (connectionProb > 0.4) {
        links.push({
          source: personas[i].id,
          target: personas[j].id,
          strength: connectionProb
        });
      }
    }
  }

  // Ensure small-world: add 3-5 random long-range connections
  // ...

  return { nodes, links };
}
```

**The key insight from Artificial Societies:** Personas aren't just individuals with traits — they exist in a *social graph* where influence flows. Our graph assembly step makes this tangible.

---

## 3. 3D FORCE GRAPH VISUALIZATION

### Why `react-force-graph-3d` over React Flow

| Criteria | React Flow | react-force-graph-3d |
|----------|-----------|---------------------|
| Visual impact | Professional 2D flowchart | Immersive 3D galaxy/network — instant "wow" |
| Hackathon demos | Common, expected | Uncommon, memorable |
| Setup time | Medium (custom nodes) | Fast (config-based API) |
| Animations | Manual CSS/JS | Built-in: particles, glow, force physics |
| Node count | Best for <50 | Handles 100s smoothly |
| Rotation/zoom | N/A | Free orbit, zoom, pan built-in |
| "Society" metaphor | Looks like a diagram | Looks like a living organism |

### Implementation

```jsx
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

function SocietyGraph({ graphData, simulationState }) {
  const graphRef = useRef();

  // Custom node rendering with THREE.js sprites
  const nodeThreeObject = useCallback((node) => {
    // Create a sphere with glow effect
    const geometry = new THREE.SphereGeometry(
      node.val || 5, // size based on influence
      16, 16
    );

    const color = getNodeColor(node, simulationState);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: node.isActive ? 1.0 : 0.4,
      emissive: node.isActive ? color : 0x000000,
      emissiveIntensity: node.isActive ? 0.5 : 0,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Add text sprite for name
    const sprite = createTextSprite(node.display_name);
    sprite.position.y = node.val + 3;
    mesh.add(sprite);

    return mesh;
  }, [simulationState]);

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={graphData}
      nodeThreeObject={nodeThreeObject}
      nodeLabel={(node) => `${node.archetype}: ${node.display_name}`}
      // Edge particles for information flow
      linkDirectionalParticles={(link) =>
        link.isActive ? 4 : 0
      }
      linkDirectionalParticleSpeed={0.005}
      linkDirectionalParticleColor={() => '#60a5fa'}
      // Edge styling
      linkColor={(link) =>
        link.isActive ? '#60a5fa' : 'rgba(255,255,255,0.05)'
      }
      linkWidth={(link) => link.isActive ? 2 : 0.5}
      // Background
      backgroundColor="#050510"
      // On click: show persona detail
      onNodeClick={(node) => setSelectedNode(node)}
      // Force configuration for nice clustering
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      warmupTicks={100}
      cooldownTicks={0}
    />
  );
}
```

### Visual Effects During Simulation

The 3D graph gives us these effects *almost for free*:

1. **Idle state:** Slowly rotating galaxy of dim nodes. Edges barely visible. Peaceful.
2. **Simulation starts:** Seed nodes glow bright. Camera auto-zooms toward them.
3. **Information spreads:** `linkDirectionalParticles` — actual particles travel along edges from sharer to receiver. This is BUILT INTO the library.
4. **Reactions appear:** Nodes change color (green/red/yellow) and grow/shrink based on sentiment.
5. **Clusters form:** The force-directed layout naturally groups similar personas together — you can see clusters of "tech people" vs "business people" vs "skeptics."
6. **Final state:** The graph is a color-coded map of your idea's reception. Green clusters = market fit. Red clusters = objections.

### Camera Animation (Auto-pilot for demo)

```javascript
// During simulation, auto-fly the camera to follow the action
function animateCamera(graphRef, activeNode) {
  const { x, y, z } = activeNode;
  graphRef.current.cameraPosition(
    { x: x + 100, y: y + 50, z: z + 100 }, // camera position
    { x, y, z }, // look-at position
    1500 // transition duration ms
  );
}
```

---

## 4. REFINED SYSTEM ARCHITECTURE

```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│               React + Vite + Tailwind                   │
│                                                         │
│  ┌───────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │  Create    │  │  3D Society    │  │   Results     │  │
│  │  Society   │  │  Graph         │  │   Dashboard   │  │
│  │  Panel     │  │  (force-3d)    │  │               │  │
│  │            │  │                │  │  + Persona    │  │
│  │  - Text    │  │  + Camera      │  │    Detail     │  │
│  │  - URLs    │  │  + Particles   │  │    Panel      │  │
│  │  - File    │  │  + Glow        │  │               │  │
│  └───────────┘  └────────────────┘  └───────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │             Activity Feed (Live Log)             │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│                      BACKEND                             │
│                 Node.js + Express                        │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │           Society Builder Service             │       │
│  │  POST /api/society/generate                   │       │
│  │  - Input: audience desc OR LinkedIn URLs      │       │
│  │  - Calls Proxycurl for LinkedIn data          │       │
│  │  - Calls LLM for persona synthesis            │       │
│  │  - Calls LLM for graph assembly               │       │
│  │  - Returns: { nodes, links } for 3D graph     │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │          Simulation Engine Service            │       │
│  │  POST /api/simulate                           │       │
│  │  - Input: society graph + content to test     │       │
│  │  - Runs 3-4 step propagation loop             │       │
│  │  - Batched LLM calls per step                 │       │
│  │  - Returns: step-by-step results              │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │              External APIs                    │       │
│  │  - Anthropic Claude (persona synth + sim)     │       │
│  │  - Proxycurl (LinkedIn public data)           │       │
│  └──────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

### API Endpoints (Refined)

```
POST /api/society/generate
  Body: {
    mode: "describe" | "linkedin",
    // For "describe" mode:
    description?: "50 B2B SaaS founders in Europe",
    persona_count?: 30,
    // For "linkedin" mode:
    linkedin_urls?: ["https://linkedin.com/in/...", ...],
    supplement_count?: 20  // fill rest with generated personas
  }
  Response: {
    society_id: "soc_abc123",
    nodes: [...],  // Full persona objects
    links: [...],  // Connection edges
    metadata: {
      total_personas: 30,
      real_profiles: 8,
      generated_profiles: 22,
      clusters: ["fintech-founders", "product-leaders", "investors"]
    }
  }

POST /api/simulate
  Body: {
    society_id: "soc_abc123",
    content: "Our startup builds...",
    seed_strategy: "auto" | "influencers" | "random"
  }
  Response: {
    steps: [
      {
        step: 1,
        reactions: [
          {
            agent_id: "persona_maria_chen",
            reaction: "positive",
            action: "share",
            sentiment: 0.8,
            quote: "Clean API play — this is exactly what's missing.",
            influenced_by: null
          },
          ...
        ]
      },
      ...
    ],
    summary: { ... }
  }
```

---

## 5. THE TWO-PHASE DEMO FLOW

This is the critical refinement. The demo now has TWO phases, not one:

### Phase 1: "Build Your Society" (The Setup — 30 seconds)

1. User types: *"European B2B SaaS founders and investors"*
2. System generates 30 personas in ~5 seconds (one LLM call)
3. **THE 3D GRAPH MATERIALIZES** — nodes appear one by one, floating into position, edges forming between related personas, clusters emerging
4. User can orbit the 3D graph, hover over nodes to see personas

This is *already* visually stunning before the simulation even starts.

### Phase 2: "Test Your Idea" (The Simulation — 30 seconds)

1. User pastes their startup pitch
2. Clicks "Run Simulation"
3. 3-4 seed nodes light up bright white
4. Particles begin flowing along edges
5. Nodes change color as reactions come in (green/red/yellow)
6. The graph transforms from a dim galaxy into a heat map of reception
7. Results panel populates with adoption %, key quotes, clusters

### Why Two Phases Win

- **Phase 1 alone is impressive.** Even without simulation, "generate a 3D network of AI personas from a text description" is a demo moment.
- **Phase 2 stacks on top.** "And NOW watch what happens when we test an idea on them" — the audience is already hooked.
- **It mirrors Artificial Societies' actual product flow:** Create a society → Run a simulation. This is startup-realistic.

---

## 6. LINKEDIN DATA INTEGRATION (Practical Approach)

### For the hackathon, here's what's actually feasible:

**Option A: Proxycurl API (Recommended)**
- Legitimate LinkedIn data API (used by 1000s of companies)
- Free tier: 10 credits on signup, 1 credit per profile
- Returns structured JSON: name, headline, experience, skills, connections
- No scraping, no cookies, no legal risk
- Sign up at nubela.co/proxycurl

**Option B: Pre-cached profiles (Backup)**
- Before the hackathon, use Proxycurl to fetch 15-20 profiles
- Save as JSON files in the repo
- During demo, load from cache and show the pipeline running
- Mention: "In production, this pulls live from LinkedIn"

**Option C: "Connect your LinkedIn" flow (Ambitious stretch)**
- User pastes their own LinkedIn URL
- We fetch their profile + their visible connections
- Build a society from their actual network
- This mirrors Artificial Societies' "Reach" product

### What to extract from profiles:

```javascript
function extractPersonaSeeds(linkedinData) {
  return {
    name: linkedinData.full_name,
    headline: linkedinData.headline,
    current_role: linkedinData.experiences?.[0]?.title,
    current_company: linkedinData.experiences?.[0]?.company,
    industry: linkedinData.industry,
    skills: linkedinData.skills?.slice(0, 10),
    education: linkedinData.education?.[0]?.school,
    seniority: inferSeniority(linkedinData), // junior/mid/senior/executive
    connection_count: linkedinData.connections,
    summary: linkedinData.summary?.slice(0, 500)
  };
}
```

---

## 7. REVISED TEAM ALLOCATION (4 People, 10 Hours)

### Roles

| Person | Role | Primary Focus |
|--------|------|---------------|
| **A** | 3D Graph Lead | `react-force-graph-3d`, node rendering, animation system, camera control |
| **B** | Backend Lead | Express API, society generation pipeline, simulation loop, LLM batching |
| **C** | Frontend/UX | Layout, input panel, results dashboard, activity feed, persona detail panel |
| **D** | Data + Prompts + Demo | Proxycurl integration, prompt engineering, demo prep, README, video |

### Revised Timeline

#### Hour 0-1: Foundation
| Who | Task |
|-----|------|
| **A** | Scaffold Vite+React. Install `react-force-graph-3d`, Three.js. Get a basic 3D graph rendering with 20 random nodes |
| **B** | Scaffold Express server. Set up Anthropic SDK. Build `/api/society/generate` endpoint (describe mode first) |
| **C** | Build layout shell: left panel (input), center (3D graph placeholder), right panel (results). Tailwind dark theme |
| **D** | Write all LLM prompts: persona synthesis, graph assembly, simulation evaluation. Test with Claude directly. Set up Proxycurl account |

#### Hour 1-3: Core Systems
| Who | Task |
|-----|------|
| **A** | Custom THREE.js node objects (spheres with glow). Node color states. Link particle system. Auto-rotate camera |
| **B** | Persona synthesis LLM pipeline working end-to-end. Graph assembly algorithm. Store societies in-memory |
| **C** | "Create Society" input form (textarea + mode selector). Wire to `/api/society/generate`. Loading states |
| **D** | Proxycurl integration + persona extraction function. Test with 5 real LinkedIn profiles. Create cached fallback data |

#### Hour 3-5: Integration + Simulation
| Who | Task |
|-----|------|
| **A** | Simulation animation system: receive step results, animate nodes sequentially. Camera auto-follows active nodes. Particle speed ramp |
| **B** | `/api/simulate` endpoint. Batched LLM simulation loop. Context propagation ("shared by X"). Summary generation |
| **C** | Results panel: adoption counter, sentiment bars, top quotes. Activity feed. Connect to simulation API |
| **D** | Full end-to-end testing. Tune prompts until reactions feel realistic. Prepare 3 demo scenarios |

**⚡ MILESTONE (Hour 5): Full flow must work.** Generate society → see 3D graph → run simulation → see results. Ugly is fine. Working is required.

#### Hour 5-7: Polish Sprint
| Who | Task |
|-----|------|
| **A** | Node-click detail panel (persona info popup). Graph transitions (dim → active). Post-processing glow bloom |
| **B** | Speed optimization. Error handling. LinkedIn mode working end-to-end. Cache layer |
| **C** | Animated counters. Loading skeleton states. Responsive layout. Dark theme polish. Typography |
| **D** | Write demo script. Practice run-through 3x. Start README |

#### Hour 7-9: Demo Prep
| Who | Task |
|-----|------|
| **A** | Final graph visual polish. Ensure 60fps. Smooth camera auto-pilot during simulation |
| **B** | Stability: run demo flow 5x without crashes. API fallback for Proxycurl failures |
| **C** | Record demo video with D. Fix final UI glitches |
| **D** | Record 3-minute video (multiple takes). Write README. Finalize pitch deck if needed |

#### Hour 9-10: Ship
| ALL | Final commit. Push. Verify public repo. README complete. Video uploaded |

---

## 8. DEMO SCRIPT (Refined — 3 Minutes)

### [0:00-0:15] HOOK
*[Screen: black. Text fades in.]*

"What if you could test your startup idea on a hundred people... without talking to a single one?"

### [0:15-0:35] PROBLEM + INSIGHT
"Traditional validation is slow and isolated. Surveys tell you what individuals think — but adoption is social. One skeptical investor kills your momentum. One enthusiastic influencer makes you viral. To understand how ideas actually spread, you need to simulate the *network*."

### [0:35-0:55] PRODUCT INTRO
*[Screen: SynthMarket interface, empty state]*

"This is SynthMarket. Step one: tell us who your audience is."

*[Type: "European B2B SaaS founders, product leaders, and early-stage investors"]*
*[Click Generate]*

### [0:55-1:20] THE FIRST WOW — SOCIETY MATERIALIZES
*[Screen: 3D graph builds — nodes appear, edges form, clusters emerge]*

"We build a society of 30 AI personas, each with distinct behavioral profiles — risk tolerance, domain expertise, social influence. And they're connected in a network that mirrors real-world professional relationships."

*[Orbit the 3D graph, hover over a few nodes to show persona details]*

### [1:20-1:40] SET UP THE SIMULATION
"Now let's test an idea."

*[Paste: "An AI tool that generates financial reports from raw data. $49/month for startups, $299/month for enterprises."]*
*[Click Run Simulation]*

### [1:40-2:20] THE SECOND WOW — SIMULATION RUNS
*[Screen: 3D graph lights up — particles flow, nodes change color]*

"Watch the idea spread. The early adopters pick it up immediately — they share it with their networks. But look — the skeptical investors push back on pricing. The enterprise buyers are blocked by compliance concerns. You can see *exactly where and why your idea stalls.*"

*[Camera auto-follows the action. Point out specific clusters.]*

### [2:20-2:45] RESULTS
*[Screen: results panel filled in]*

"In 20 seconds: 62% adoption, strong product-market fit with technical founders, but pricing objections from enterprise. The top quote: *'Love the concept but I'd need SOC 2 before I'd even start a trial.'* That insight would have taken weeks of interviews."

### [2:45-3:00] CLOSE
"SynthMarket: generate a society, test your idea, find your market — before writing a single line of code."

---

## 9. TECHNICAL RISK MITIGATION

| Risk | Probability | Mitigation |
|------|------------|------------|
| Proxycurl free tier runs out | Medium | Cache 15 profiles in advance. Fall back to cache during demo |
| 3D graph performance with 30+ nodes | Low | `react-force-graph-3d` handles 1000s. Keep node count ≤40 |
| LLM returns bad JSON for society gen | Medium | Strict prompt + JSON mode + try/catch + retry once |
| Society generation too slow | Medium | Use Claude Haiku for persona synthesis (fast). Sonnet for simulation only |
| Camera animation awkward | Medium | Default to slow auto-rotate. Only auto-fly if someone dedicates time |
| Node text labels unreadable | Medium | Use THREE.js Sprite for labels. Scale with camera distance |
| Demo flow breaks live | High | Pre-record backup video of the full flow. Have it ready on the laptop |

---

## 10. SCOPE CONTROL (CRITICAL)

### MUST HAVE (or demo fails):
- ✅ "Describe audience" → generate society → 3D graph renders
- ✅ Paste idea → run simulation → 3D graph animates
- ✅ Results panel with adoption %, sentiment, top quotes
- ✅ Particle animation on edges during simulation
- ✅ Node color change based on reaction (green/red/yellow)

### NICE TO HAVE (after hour 5):
- ✅ LinkedIn URL input → Proxycurl fetch → real persona
- ✅ Click node → detail panel with full persona profile
- ✅ Camera auto-zoom to active nodes during simulation
- ✅ Activity feed with live reaction log
- ✅ "Try another idea" reset

### DO NOT BUILD:
- ❌ A/B variant comparison
- ❌ File upload for pitch decks
- ❌ User authentication
- ❌ Database persistence
- ❌ WebSocket streaming
- ❌ Custom 3D models for nodes (use simple spheres)
- ❌ Export/download functionality
- ❌ Twitter/X integration (LinkedIn only if anything)

---

## 11. PROMPTS REFERENCE

### Prompt 1: Society Generation (Describe Mode)

```
You are building an AI society for a market simulation. Given a description
of a target audience, generate {count} diverse personas that form a
realistic professional network.

Target audience description:
"{user_description}"

Generate exactly {count} personas. Each persona must be DISTINCT — vary by:
- Seniority (junior to C-level)
- Risk tolerance (conservative to adventurous)
- Role type (technical, business, investor, creative)
- Domain expertise
- Personality (skeptic, enthusiast, pragmatist, etc.)

For each persona, return:
{
  "id": "p_{index}",
  "display_name": "First L.",
  "archetype": "<2-3 word archetype>",
  "role": "<job title>",
  "company_type": "<startup / enterprise / VC / agency / etc>",
  "traits": {
    "risk_tolerance": <0-1>,
    "price_sensitivity": <0-1>,
    "innovation_openness": <0-1>,
    "social_influence": <0-1>,
    "tech_savviness": <0-1>,
    "domain_expertise": ["<domain1>", "<domain2>"]
  },
  "behavioral_summary": "<2 sentence personality + decision-making style>",
  "connection_tags": ["<tag1>", "<tag2>"]  // used for graph assembly
}

Also return a "connections" array that defines the network edges:
{
  "connections": [
    { "from": "p_0", "to": "p_3", "reason": "same domain" },
    ...
  ]
}

The network should have:
- 2-3 hub nodes with 6+ connections (high social_influence)
- Natural clusters (e.g., "tech founders", "investors", "enterprise buyers")
- Cross-cluster bridges (people who connect different groups)
- Average 3-4 connections per node

Return ONLY valid JSON. No markdown.
```

### Prompt 2: LinkedIn Persona Synthesis

```
Given this public LinkedIn profile data, create a behavioral persona for
a market simulation.

Profile data:
{raw_profile_json}

Return a JSON object matching this schema:
{
  "id": "p_linkedin_{hash}",
  "display_name": "<First name + last initial>",
  "archetype": "<2-3 word archetype based on their career>",
  "role": "<current title>",
  "company_type": "<inferred company stage/type>",
  "source": "linkedin",
  "traits": {
    "risk_tolerance": <inferred 0-1>,
    "price_sensitivity": <inferred 0-1>,
    "innovation_openness": <inferred 0-1>,
    "social_influence": <inferred from connections count + seniority>,
    "tech_savviness": <inferred from skills + background>,
    "domain_expertise": [<top 3 inferred domains>]
  },
  "behavioral_summary": "<2 sentences capturing how this person
    evaluates new products/ideas based on their background>",
  "connection_tags": [<tags for graph assembly>]
}

Be specific. A "VP Product at Stripe" thinks very differently from
a "Junior Developer at a startup." Use their actual background to
create a realistic behavioral profile.
```

### Prompt 3: Simulation Step

```
You are simulating how a group of personas react to a startup idea.
Each persona has a unique personality and their own way of evaluating ideas.

The idea being tested:
---
{user_content}
---

Context for this step:
{step_context}
// Step 1: "These personas are seeing the idea for the first time."
// Step 2+: "These personas heard about the idea from their connections.
//           [Agent X] shared it saying: '[their quote]'"

Personas to evaluate:
{personas_json_array}

For EACH persona, return their reaction based on who they are:

[
  {
    "agent_id": "<id>",
    "reaction": "positive" | "negative" | "neutral",
    "action": "share" | "engage" | "debate" | "ignore",
    "sentiment_score": <float -1.0 to 1.0>,
    "quote": "<1 sentence, in character, natural>",
    "would_share": <boolean>,
    "reasoning": "<1 sentence internal reasoning>"
  }
]

RULES:
- Stay in character. A "Skeptical Investor" IS skeptical.
- Vary reactions. Not everything should be positive.
- Quotes should sound like real people, not marketing copy.
- Consider how the idea relates to each persona's domain expertise.
- If exposed via a negative share ("debate"), weight toward skepticism.
- Return ONLY valid JSON.
```

---

## 12. FILE STRUCTURE

```
synthmarket/
├── package.json          # root scripts: "dev" runs both
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── SocietyGraph.jsx     # 3D force graph
│   │   │   ├── CreatePanel.jsx       # society creation input
│   │   │   ├── SimulationPanel.jsx   # idea input + run button
│   │   │   ├── ResultsPanel.jsx      # metrics + quotes
│   │   │   ├── PersonaDetail.jsx     # node click popup
│   │   │   └── ActivityFeed.jsx      # live log
│   │   ├── hooks/
│   │   │   ├── useSimulation.js
│   │   │   └── useSociety.js
│   │   └── styles/
│   │       └── globals.css
├── server/
│   ├── package.json
│   ├── index.js
│   ├── routes/
│   │   ├── society.js
│   │   └── simulate.js
│   ├── services/
│   │   ├── personaSynthesis.js
│   │   ├── graphAssembly.js
│   │   ├── simulationEngine.js
│   │   └── linkedinFetcher.js
│   ├── prompts/
│   │   ├── societyGeneration.txt
│   │   ├── personaSynthesis.txt
│   │   └── simulationStep.txt
│   └── data/
│       └── cachedProfiles.json    # backup LinkedIn data
└── README.md
```

---

## 13. JUDGING ALIGNMENT (Updated)

| Criteria | What We Show |
|----------|-------------|
| **Clear problem** | "You can't test social dynamics without real people — until now" |
| **Strong demo** | TWO wow moments: society materializing in 3D + simulation animation |
| **Real-world usefulness** | Artificial Societies raised €4.5M for this. The market is validated |
| **Visual wow factor** | 3D force graph with particles, glow, and color changes — on a black background — this looks like a sci-fi command center |
| **Technical depth** | Multi-agent LLM simulation + real data ingestion + network theory + 3D WebGL rendering |
| **Startup viability** | We can reference Artificial Societies as market validation. Our angle: open, developer-friendly, API-first |

---

## 14. FINAL PITCH STATEMENT

> "We built a system that generates a network of AI personas from real-world data, then simulates how your startup idea spreads through that society — showing you exactly who adopts, who objects, and why — before you build a single feature."