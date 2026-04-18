import { useState, useCallback } from 'react'
import SocietyBuilderView from './components/SocietyBuilderView'
import SimulationView from './components/SimulationView'
import api from './api/client'
import { isPipelineLive } from './lib/pipelineConfig'
import { buildClientSimulationPlaybook } from './lib/clientSimulationPlaybook'
import { Sparkles } from 'lucide-react'

function mapSimulationToPanel(simulation) {
  if (!simulation) return null
  const m = simulation.metrics || {}
  const quotes = simulation.quotes || []
  return {
    headline: simulation.headline,
    narrative: simulation.narrative,
    summary: {
      adoption_rate: m.adoption_rate,
      positive_count: m.positive_count,
      negative_count: m.negative_count,
      neutral_count: m.neutral_count,
      top_quotes: quotes.map((q) => ({
        persona: q.name,
        archetype: q.archetype,
        quote: q.quote,
      })),
    },
  }
}

function buildLocalSimulation(graphPayload, ideaPrompt) {
  const nodes = graphPayload?.nodes || []
  const n = nodes.length
  const trimmed = (ideaPrompt || '').trim()

  const quotes = nodes.slice(0, Math.min(5, Math.max(2, n || 2))).map((node, idx) => ({
    persona_id: node.id,
    name: node.name || node.display_name || `Persona ${idx + 1}`,
    archetype: node.archetype || 'Member',
    quote:
      idx % 2 === 0
        ? `I need stronger proof for "${trimmed.slice(0, 42)}${trimmed.length > 42 ? '...' : ''}" before rollout.`
        : 'This direction is promising if onboarding is simple for our team.',
    sentiment: ['positive', 'neutral', 'negative'][idx % 3],
  }))

  const positive_count = Math.max(1, Math.floor(n * 0.36) || 1)
  const negative_count = Math.max(0, Math.floor(n * 0.22))
  const neutral_count = Math.max(0, n - positive_count - negative_count)

  return {
    headline: 'Fallback simulation generated in browser',
    narrative: `The prompt "${trimmed.slice(0, 96)}${trimmed.length > 96 ? '...' : ''}" produced mixed but actionable feedback across ${n || 'several'} personas.`,
    quotes,
    metrics: {
      adoption_rate: n ? Math.min(0.82, 0.3 + n * 0.035) : 0.35,
      positive_count,
      negative_count,
      neutral_count,
    },
  }
}

function App() {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('builder')
  const [networkGraph, setNetworkGraph] = useState(null)
  const [playbook, setPlaybook] = useState([])
  const [simulationResult, setSimulationResult] = useState(null)

  const handleSearch = useCallback(async (query) => {
    if (isPipelineLive()) {
      setLoading(true)
      try {
        return await api.searchLinkedIn(query)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 380))
    setLoading(false)
    return {
      society_id: `sim_${Date.now()}`,
      status: 'processing',
      message: 'Demo pipeline: index match + pre-built personas (set VITE_PIPELINE_LIVE=true for live API)',
    }
  }, [])

  const handleCloseSimulation = useCallback(() => {
    setView('builder')
    setNetworkGraph(null)
    setPlaybook([])
    setSimulationResult(null)
  }, [])

  const handleSimulationRequest = useCallback(async (payload) => {
    const { societyId, ideaPrompt, societySnapshot } = payload

    const graphPayload = {
      nodes: societySnapshot?.nodes || [],
      links: societySnapshot?.links || [],
    }

    try {
      const res = await api.runSimulation({
        society_id: societyId,
        idea_prompt: ideaPrompt,
        content: ideaPrompt,
        seed_strategy: 'auto',
        society_snapshot: societySnapshot,
      })

      const graph = res.graph?.nodes?.length ? res.graph : societySnapshot
      const normalizedGraph = {
        nodes: graph?.nodes || [],
        links: graph?.links || [],
      }
      const simulation = res.simulation || buildLocalSimulation(normalizedGraph, ideaPrompt)

      setNetworkGraph(normalizedGraph)
      setPlaybook(buildClientSimulationPlaybook(normalizedGraph, { quotes: simulation?.quotes }))
      setSimulationResult(mapSimulationToPanel(simulation))
      setView('simulation')
    } catch (error) {
      console.warn('Simulation API failed, using local fallback:', error?.message || error)
      const fallback = buildLocalSimulation(graphPayload, ideaPrompt)

      setNetworkGraph(graphPayload)
      setPlaybook(buildClientSimulationPlaybook(graphPayload, { quotes: fallback.quotes }))
      setSimulationResult(mapSimulationToPanel(fallback))
      setView('simulation')
    }
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Latentix</h1>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                AI Synthetic Market Simulator
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {view === 'simulation' ? 'Simulation + 3D' : 'Phase 1: Society Builder'}
              </div>
              {!isPipelineLive() && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 border border-border rounded px-1.5 py-0.5">
                  Demo index pipeline
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={view !== 'builder' ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
          <SocietyBuilderView
            onSearch={handleSearch}
            loading={loading}
            pipelineLive={isPipelineLive()}
            onSimulationRequest={handleSimulationRequest}
          />
        </div>
        {view === 'simulation' && networkGraph && (
          <div className="flex min-h-0 flex-1 flex-col">
            <SimulationView
              graphData={networkGraph}
              playbook={playbook}
              result={simulationResult}
              onBack={handleCloseSimulation}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
