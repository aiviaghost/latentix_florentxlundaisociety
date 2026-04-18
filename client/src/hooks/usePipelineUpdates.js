import { useState, useEffect, useRef, useCallback } from 'react'
import { isPipelineLive } from '../lib/pipelineConfig'
import { scheduleSimulatedPipeline } from '../lib/pipelineSimulation'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
const MAX_WS_RECONNECTS = 5
const POLL_MS = 2000

/**
 * @param {string|null} societyId
 * @param {boolean} enabled
 * @param {{ query?: string }} [options] - query seeds simulation copy
 */
export default function usePipelineUpdates(societyId, enabled = false, options = {}) {
  const { query: simulationQuery = '' } = options
  const live = isPipelineLive()

  const [profiles, setProfiles] = useState([])
  const [personas, setPersonas] = useState([])
  const [graphState, setGraphState] = useState(null)
  const [isComplete, setIsComplete] = useState(false)

  const intervalRef = useRef(null)
  const pollingStartedRef = useRef(false)
  const wsRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef(null)
  const intentionalCloseRef = useRef(false)
  const mountedRef = useRef(true)
  const isCompleteRef = useRef(false)

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    pollingStartedRef.current = false
  }, [])

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
            id: update.persona.id,
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
        if (update.type) {
          console.warn('Unknown update type:', update.type)
        }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    if (!enabled || !societyId) {
      return undefined
    }

    intentionalCloseRef.current = false
    clearPolling()
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    // --- Simulated pipeline (default) ---
    if (!live) {
      const cancelSim = scheduleSimulatedPipeline(applyUpdate, { query: simulationQuery })
      return () => {
        cancelSim()
      }
    }

    // --- Live: WebSocket with polling fallback + reconnect ---
    const startPolling = () => {
      if (pollingStartedRef.current) return
      pollingStartedRef.current = true

      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/society/${societyId}/status`)
          if (response.ok) {
            const data = await response.json()
            if (data.profiles) setProfiles(data.profiles)
            if (data.personas) setPersonas(data.personas)
            if (data.graphState) setGraphState(data.graphState)
            if (data.status === 'complete') {
              setIsComplete(true)
              clearPolling()
            }
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, POLL_MS)
    }

    const connectWs = () => {
      if (!mountedRef.current) return

      const wsUrl = `${WS_BASE}/api/society/stream/${societyId}`
      let ws
      try {
        ws = new WebSocket(wsUrl)
      } catch (err) {
        console.warn('WebSocket not supported, using polling', err)
        startPolling()
        return
      }

      wsRef.current = ws

      ws.onopen = () => {
        reconnectAttemptRef.current = 0
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data)
          applyUpdate(update)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = () => {
        console.warn('WebSocket error, falling back to polling')
        intentionalCloseRef.current = true
        ws.close()
        startPolling()
      }

      ws.onclose = () => {
        wsRef.current = null
        if (intentionalCloseRef.current) {
          intentionalCloseRef.current = false
          return
        }
        if (!mountedRef.current || isCompleteRef.current) return

        if (!pollingStartedRef.current && reconnectAttemptRef.current < MAX_WS_RECONNECTS) {
          const delay = Math.min(3000, 500 * 2 ** reconnectAttemptRef.current)
          reconnectAttemptRef.current += 1
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null
            connectWs()
          }, delay)
        } else if (!pollingStartedRef.current) {
          startPolling()
        }
      }
    }

    connectWs()

    return () => {
      intentionalCloseRef.current = true
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      clearPolling()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [societyId, enabled, live, simulationQuery, applyUpdate, clearPolling])

  const reset = useCallback(() => {
    setProfiles([])
    setPersonas([])
    setGraphState(null)
    setIsComplete(false)
  }, [])

  return {
    profiles,
    personas,
    graphState,
    isComplete,
    reset,
  }
}
