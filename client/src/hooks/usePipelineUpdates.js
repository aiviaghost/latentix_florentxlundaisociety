import { useState, useEffect, useRef } from 'react'

/**
 * Hook to handle real-time pipeline updates
 *
 * Supports:
 * - WebSocket for real-time updates (when backend is ready)
 * - Polling fallback
 * - Simulated data for testing
 *
 * @param {string} societyId - ID of the society being generated
 * @param {boolean} enabled - Whether to start listening for updates
 */
export default function usePipelineUpdates(societyId, enabled = false) {
  const [profiles, setProfiles] = useState([])
  const [personas, setPersonas] = useState([])
  const [graphState, setGraphState] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!enabled || !societyId) {
      return
    }

    // Try WebSocket connection first
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/api/society/stream/${societyId}`

    let ws
    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data)
          handleUpdate(update)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = () => {
        console.warn('WebSocket failed, falling back to polling')
        ws.close()
        startPolling()
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
      }
    } catch (err) {
      // WebSocket not available, use polling
      console.warn('WebSocket not supported, using polling')
      startPolling()
    }

    function startPolling() {
      // Poll for updates every 2 seconds
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/society/${societyId}/status`)
          if (response.ok) {
            const data = await response.json()

            // Update state based on response
            if (data.profiles) setProfiles(data.profiles)
            if (data.personas) setPersonas(data.personas)
            if (data.graphState) setGraphState(data.graphState)
            if (data.status === 'complete') {
              setIsComplete(true)
              clearInterval(intervalRef.current)
            }
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 2000)
    }

    function handleUpdate(update) {
      switch (update.type) {
        case 'profile_found':
          setProfiles(prev => [...prev, { ...update.profile, status: 'found' }])
          break

        case 'profile_scraped':
          setProfiles(prev => prev.map(p =>
            p.id === update.profile.id
              ? { ...p, ...update.profile, status: 'scraped' }
              : p
          ))
          break

        case 'persona_synthesizing':
          setPersonas(prev => [
            ...prev,
            {
              id: update.persona.id,
              sourceProfileId: update.profileId,
              status: 'synthesizing',
              name: update.persona.name || 'Synthesizing...',
            }
          ])
          break

        case 'persona_complete':
          setPersonas(prev => prev.map(p =>
            p.id === update.persona.id
              ? { ...p, ...update.persona, status: 'ready' }
              : p
          ))
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
          console.warn('Unknown update type:', update.type)
      }
    }

    // Cleanup
    return () => {
      if (ws) ws.close()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [societyId, enabled])

  // Reset function
  const reset = () => {
    setProfiles([])
    setPersonas([])
    setGraphState(null)
    setIsComplete(false)
  }

  return {
    profiles,
    personas,
    graphState,
    isComplete,
    reset,
  }
}
