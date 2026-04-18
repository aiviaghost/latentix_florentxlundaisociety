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

  return { profiles, personas, graphState, isComplete, reset, applyUpdate }
}
