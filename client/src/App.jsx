import { useRef, useState, useCallback, useMemo } from 'react'
import SocietyBuilderView from './components/SocietyBuilderView'
import SimulationView from './components/SimulationView'
import api from './api/client'
import { buildConversationFromRounds } from './lib/simulationConversation'
import { Sparkles } from 'lucide-react'

export default function App() {
  const [view, setView] = useState('builder')
  const [networkGraph, setNetworkGraph] = useState(null)
  const [simSession, setSimSession] = useState(null)
  const [focusedPersonaId, setFocusedPersonaId] = useState(null)

  const societyRef = useRef(null)
  const streamAbortRef = useRef(null)
  const searchAbortRef = useRef(null)
  const graphPayloadRef = useRef(null)
  const societyIdRef = useRef(null)

  const graphSimulationState = useMemo(() => {
    const pending = (simSession?.pendingPersonaIds || []).map((id) => String(id))
    const sentimentByPersonaId = {}
    for (const r of simSession?.personaResults || []) {
      if (r.persona_id != null) sentimentByPersonaId[String(r.persona_id)] = r.sentiment_score
    }
    return {
      focusNodeId: focusedPersonaId != null ? String(focusedPersonaId) : null,
      pendingPersonaIds: pending,
      sentimentByPersonaId,
      streaming: simSession?.status === 'streaming',
    }
  }, [focusedPersonaId, simSession])

  const handleSearch = useCallback(async (query, applyUpdate) => {
    searchAbortRef.current?.abort()
    const ac = new AbortController()
    searchAbortRef.current = ac
    try {
      const pipelineLive = import.meta.env.VITE_PIPELINE_LIVE === 'true'
      const society = await api.generateAudience(query, undefined, pipelineLive ? applyUpdate : null, {
        signal: ac.signal,
      })
      societyRef.current = society
      return society
    } finally {
      if (searchAbortRef.current === ac) {
        searchAbortRef.current = null
      }
    }
  }, [])

  const handleCloseSimulation = useCallback(() => {
    streamAbortRef.current?.abort()
    streamAbortRef.current = null
    setView('builder')
    setNetworkGraph(null)
    setSimSession(null)
    setFocusedPersonaId(null)
    graphPayloadRef.current = null
    societyIdRef.current = null
  }, [])

  const applyLegacySimulationResult = useCallback((payload) => {
    const graph = payload.graph?.nodes?.length ? payload.graph : graphPayloadRef.current
    const normalizedGraph = { nodes: graph?.nodes || [], links: graph?.links || [] }
    setNetworkGraph(normalizedGraph)
    graphPayloadRef.current = normalizedGraph

    const sim = payload.simulation
    setSimSession((s) => {
      if (!s) return s
      const rounds = [...s.rounds]
      const last = rounds[rounds.length - 1]
      if (last && !last.assistant) {
        rounds[rounds.length - 1] = { ...last, assistant: sim }
      }
      return {
        ...s,
        status: 'complete',
        error: null,
        pendingPersonaIds: [],
        rounds,
      }
    })
  }, [])

  const runPersonasStreamOnce = useCallback(
    async (ideaPrompt, priorRounds) => {
      const societyId = societyIdRef.current
      const graphPayload = graphPayloadRef.current
      if (!societyId || !graphPayload) return

      const conversation = buildConversationFromRounds(priorRounds)
      const ac = new AbortController()
      streamAbortRef.current = ac

      setSimSession((s) =>
        s
          ? {
              ...s,
              status: 'streaming',
              error: null,
              personaResults: [],
              pendingPersonaIds: [],
            }
          : s
      )

      try {
        await api.runPersonasSimulationStream(
          {
            society_id: societyId,
            idea_prompt: ideaPrompt,
            content: ideaPrompt,
            seed_strategy: 'auto',
            society_snapshot: graphPayload,
            conversation,
          },
          {
            onPersonaStart: ({ persona_id }) => {
              if (persona_id == null || persona_id === '') return
              const idStr = String(persona_id)
              setSimSession((s) => {
                if (!s) return s
                const set = new Set((s.pendingPersonaIds || []).map((x) => String(x)))
                set.add(idStr)
                return { ...s, pendingPersonaIds: Array.from(set) }
              })
            },
            onPersonaComplete: (row) => {
              const pid = row.persona_id != null ? String(row.persona_id) : ''
              setSimSession((s) => {
                if (!s) return s
                const pending = (s.pendingPersonaIds || []).filter((id) => String(id) !== pid)
                return {
                  ...s,
                  pendingPersonaIds: pending,
                  personaResults: [...(s.personaResults || []), { ...row, persona_id: pid || row.persona_id }],
                }
              })
            },
            onSummary: (summary) => {
              const sim = {
                headline: summary.headline,
                narrative: summary.narrative,
                consolidated_brief: summary.consolidated_brief,
                quotes: summary.quotes,
                metrics: summary.metrics,
              }
              setSimSession((s) => {
                if (!s) return s
                const rounds = [...s.rounds]
                const last = rounds[rounds.length - 1]
                if (last && !last.assistant) {
                  rounds[rounds.length - 1] = { ...last, assistant: sim }
                }
                return {
                  ...s,
                  status: 'complete',
                  error: null,
                  pendingPersonaIds: [],
                  rounds,
                }
              })
            },
            onComplete: () => {},
            onError: ({ message }) => {
              setSimSession((s) =>
                s ? { ...s, status: 'error', error: message || 'Stream failed' } : s
              )
            },
          },
          { signal: ac.signal }
        )
      } catch (e) {
        if (e?.name === 'AbortError' || ac.signal.aborted) {
          setSimSession((s) =>
            s?.status === 'streaming'
              ? { ...s, status: 'error', error: 'Stopped', pendingPersonaIds: [] }
              : s
          )
        } else {
          try {
            const payload = await api.runSimulation({
              society_id: societyId,
              idea_prompt: ideaPrompt,
              content: ideaPrompt,
              seed_strategy: 'auto',
              society_snapshot: graphPayload,
              conversation,
            })
            applyLegacySimulationResult(payload)
          } catch {
            const msg = e?.message || 'Simulation failed'
            setSimSession((s) => (s ? { ...s, status: 'error', error: msg } : s))
          }
        }
      } finally {
        if (streamAbortRef.current === ac) {
          streamAbortRef.current = null
        }
      }

      if (ac.signal.aborted) {
        setSimSession((s) =>
          s?.status === 'streaming'
            ? { ...s, status: 'error', error: 'Stopped', pendingPersonaIds: [] }
            : s
        )
      }
    },
    [applyLegacySimulationResult]
  )

  const handleBeginSimulation = useCallback(
    (payload) => {
      const { societyId, ideaPrompt, societySnapshot, audienceQuery } = payload

      const society = societyRef.current
      const effectiveSocietyId = society?.society_id || societyId
      const graphPayload = society?.nodes?.length
        ? { nodes: society.nodes, links: society.links || [] }
        : { nodes: societySnapshot?.nodes || [], links: societySnapshot?.links || [] }

      const normalizedGraph = {
        nodes: graphPayload.nodes || [],
        links: graphPayload.links || [],
      }

      graphPayloadRef.current = normalizedGraph
      societyIdRef.current = effectiveSocietyId

      setNetworkGraph(normalizedGraph)
      setFocusedPersonaId(null)
      setView('simulation')

      setSimSession({
        audienceQuery: audienceQuery || '',
        initialPrompt: ideaPrompt,
        status: 'streaming',
        error: null,
        personaResults: [],
        pendingPersonaIds: [],
        rounds: [{ userText: ideaPrompt, assistant: null }],
      })

      const priorRounds = []
      void runPersonasStreamOnce(ideaPrompt, priorRounds)
    },
    [runPersonasStreamOnce]
  )

  const handleFollowUp = useCallback(
    (text) => {
      const trimmed = (text || '').trim()
      if (!trimmed) return

      setSimSession((s) => {
        if (!s || s.status === 'streaming') return s
        const prior = s.rounds.filter((r) => r.assistant)
        const next = {
          ...s,
          rounds: [...s.rounds, { userText: trimmed, assistant: null }],
          status: 'streaming',
          error: null,
          personaResults: [],
          pendingPersonaIds: [],
        }
        queueMicrotask(() => {
          void runPersonasStreamOnce(trimmed, prior)
        })
        return next
      })
    },
    [runPersonasStreamOnce]
  )

  const handleAbortStream = useCallback(() => {
    streamAbortRef.current?.abort()
    streamAbortRef.current = null
    setSimSession((s) =>
      s
        ? {
            ...s,
            status: 'error',
            error: 'Stopped',
            pendingPersonaIds: [],
          }
        : s
    )
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
              {view === 'simulation' ? 'Network simulation' : 'Phase 1: Society Builder'}
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={view !== 'builder' ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
          <SocietyBuilderView onSearch={handleSearch} onBeginSimulation={handleBeginSimulation} />
        </div>
        {view === 'simulation' && networkGraph && (
          <div className="flex min-h-0 flex-1 flex-col">
            <SimulationView
              graphData={networkGraph}
              simSession={simSession}
              graphSimulationState={graphSimulationState}
              focusedPersonaId={focusedPersonaId}
              onGraphNodeClick={(node) =>
                setFocusedPersonaId(node?.id != null && node.id !== '' ? String(node.id) : null)
              }
              onFollowUp={handleFollowUp}
              onAbortStream={handleAbortStream}
              onBack={handleCloseSimulation}
            />
          </div>
        )}
      </main>
    </div>
  )
}
