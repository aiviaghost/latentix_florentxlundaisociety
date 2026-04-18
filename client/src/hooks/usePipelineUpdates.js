import { useState, useEffect, useCallback } from 'react'
import { scheduleSimulatedPipeline } from '../lib/pipelineSimulation'

const pipelineLive = import.meta.env.VITE_PIPELINE_LIVE === 'true'

/**
 * @param {string|null} societyId
 * @param {boolean} enabled
 * @param {{ query?: string, nodes?: Array, links?: Array }} [options]
 */
export default function usePipelineUpdates(societyId, enabled = false, options = {}) {
  const { query: simulationQuery = '', nodes = [], links = [] } = options

  const [profiles, setProfiles] = useState([])
  const [personas, setPersonas] = useState([])
  const [graphState, setGraphState] = useState(null)
  const [isComplete, setIsComplete] = useState(false)

  const applyUpdate = useCallback((update) => {
    switch (update.type) {
      case 'profile_found':
        setProfiles((prev) => [...prev, { ...update.profile, status: 'found' }])
        break

      case 'profile_scraped':
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === update.profile.id ? { ...p, ...update.profile, status: 'scraped' } : p
          )
        )
        break

      case 'persona_synthesizing':
        setPersonas((prev) => [
          ...prev,
          {
            ...update.persona,
            sourceProfileId: update.profileId,
            status: 'synthesizing',
            name: update.persona.name || 'Linking…',
          },
        ])
        break

      case 'persona_complete': {
        const incoming = update.persona
        setPersonas((prev) => {
          const sp = incoming?.sourceProfileId
          if (sp) {
            const idx = prev.findIndex((p) => p.sourceProfileId === sp || p.id === sp)
            if (idx >= 0) {
              return prev.map((p, i) =>
                i === idx ? { ...p, ...incoming, status: 'ready' } : p
              )
            }
          }
          const idxById = prev.findIndex((p) => p.id === incoming?.id)
          if (idxById >= 0) {
            return prev.map((p, i) =>
              i === idxById ? { ...p, ...incoming, status: 'ready' } : p
            )
          }
          return [...prev, { ...incoming, status: 'ready' }]
        })
        break
      }

      case 'graph_progress':
        setGraphState({
          status: 'processing',
          message: update.message,
          connectionsBuilt: update.connectionsBuilt,
          totalConnections: update.totalConnections,
        })
        break

      case 'graph_complete':
        setGraphState({
          status: 'complete',
          clusters: update.clusters,
          nodes: update.nodes,
          links: update.links,
        })
        setIsComplete(true)
        break

      default:
        if (update.type) console.warn('Unknown update type:', update.type)
    }
  }, [])

  useEffect(() => {
    if (pipelineLive) return
    if (!enabled || !societyId || societyId === 'loading' || !nodes.length) return
    const cancel = scheduleSimulatedPipeline(applyUpdate, {
      query: simulationQuery,
      nodes,
      links,
    })
    return cancel
  }, [societyId, enabled, simulationQuery, nodes, links, applyUpdate])

  const reset = useCallback(() => {
    setProfiles([])
    setPersonas([])
    setGraphState(null)
    setIsComplete(false)
  }, [])

  return { profiles, personas, graphState, isComplete, reset, applyUpdate }
}
