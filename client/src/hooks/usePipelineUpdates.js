import { useState, useCallback } from 'react'

export default function usePipelineUpdates() {
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
            name: update.persona.name || 'Linking\u2026',
          },
        ])
        break

      case 'persona_complete':
        setPersonas((prev) => {
          const idx = prev.findIndex(
            (p) =>
              p.id === update.persona.id ||
              (update.persona.sourceProfileId && p.sourceProfileId === update.persona.sourceProfileId)
          )
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...prev[idx], ...update.persona, status: 'ready' }
            return updated
          }
          return [...prev, { ...update.persona, status: 'ready' }]
        })
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
        if (update.type && !['society_ready', 'error'].includes(update.type))
          console.warn('Unknown update type:', update.type)
    }
  }, [])

  const reset = useCallback(() => {
    setProfiles([])
    setPersonas([])
    setGraphState(null)
    setIsComplete(false)
  }, [])

  return { profiles, personas, graphState, isComplete, applyUpdate, reset }
}
