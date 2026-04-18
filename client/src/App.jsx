import { useRef, useState, useCallback } from 'react'
import SocietyBuilderView from './components/SocietyBuilderView'
import SimulationView from './components/SimulationView'
import api from './api/client'
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

function App() {
  const [view, setView] = useState('builder')
  const [networkGraph, setNetworkGraph] = useState(null)
  const [playbook, setPlaybook] = useState([])
  const [simulationResult, setSimulationResult] = useState(null)

  // Stores the full society returned by generateAudience for use in handleSimulationRequest
  const societyRef = useRef(null)

  const handleSearch = useCallback(async (query, personaCount, onEvent) => {
    const society = await api.generateAudience(query, personaCount, onEvent)
    societyRef.current = society
    return society
  }, [])

  const handleCloseSimulation = useCallback(() => {
    setView('builder')
    setNetworkGraph(null)
    setPlaybook([])
    setSimulationResult(null)
  }, [])

  const handleSimulationRequest = useCallback(async (payload) => {
    const { societyId, ideaPrompt, societySnapshot } = payload

    const society = societyRef.current
    const effectiveSocietyId = society?.society_id || societyId
    const graphPayload = society?.nodes?.length
      ? { nodes: society.nodes, links: society.links || [] }
      : { nodes: societySnapshot?.nodes || [], links: societySnapshot?.links || [] }

    const res = await api.runSimulation({
      society_id: effectiveSocietyId,
      idea_prompt: ideaPrompt,
      content: ideaPrompt,
      seed_strategy: 'auto',
      society_snapshot: graphPayload,
    })

    const graph = res.graph?.nodes?.length ? res.graph : graphPayload
    const normalizedGraph = { nodes: graph?.nodes || [], links: graph?.links || [] }

    setNetworkGraph(normalizedGraph)
    setPlaybook(buildClientSimulationPlaybook(normalizedGraph, { quotes: res.simulation?.quotes }))
    setSimulationResult(mapSimulationToPanel(res.simulation))
    setView('simulation')
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
            <div className="text-xs text-muted-foreground">
              {view === 'simulation' ? 'Simulation + 3D' : 'Phase 1: Society Builder'}
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={view !== 'builder' ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
          <SocietyBuilderView
            onSearch={handleSearch}
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
