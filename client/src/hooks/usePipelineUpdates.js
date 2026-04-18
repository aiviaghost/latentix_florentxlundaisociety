import { useState, useEffect, useCallback } from 'react'
import { scheduleSimulatedPipeline } from '../lib/pipelineSimulation'

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

      case 'persona_complete':
        setPersonas((prev) =>
          prev.map((p) =>
            p.id === update.persona.id ? { ...p, ...update.persona, status: 'ready' } : p
          )
        )
        break

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
    if (!enabled || !societyId || !nodes.length) return
    const cancel = scheduleSimulatedPipeline(applyUpdate, { query: simulationQuery, nodes, links })
    return cancel
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societyId, enabled])

  const reset = useCallback(() => {
    setProfiles([])
    setPersonas([])
    setGraphState(null)
    setIsComplete(false)
  }, [])

  return { profiles, personas, graphState, isComplete, reset }
}
