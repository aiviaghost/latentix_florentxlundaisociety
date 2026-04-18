import axios from 'axios'
import { consumeFramedSseReader, consumeSocietySearchSseReader } from '../lib/sseReader.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Society Builder: pass `onEvent` to receive each `data:` JSON record from POST /society/search
 * (profile_found, persona_synthesizing, persona_complete, graph_progress, graph_complete, …)
 * while the stream is open. The hook `usePipelineUpdates` maps these into React state.
 */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for LLM operations
})

/**
 * API CONTRACT
 *
 * This file defines the contract between frontend and backend.
 */

const api = {
  /**
   * Generate an audience from a natural-language description (POST /society/search, SSE).
   *
   * @param {string} query
   * @param {number} [persona_count]
   * @param {((evt: { type: string } & Record<string, unknown>) => void) | null} [onEvent] — per `data:` record (optional)
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<Object>} { society_id, status, nodes, links, metadata }
   */
  async generateAudience(query, persona_count, onEvent, options = {}) {
    const { signal } = options
    const res = await fetch(`${API_BASE_URL}/society/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ query, persona_count }),
      signal,
    })

    if (!res.ok || !res.body) {
      let msg = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson?.error) msg = errJson.error
      } catch {
        try {
          const t = await res.text()
          if (t) msg = t.slice(0, 200)
        } catch {
          /* ignore */
        }
      }
      throw new Error(msg)
    }

    const reader = res.body.getReader()
    let merged = null
    let streamError = null

    await consumeSocietySearchSseReader(
      reader,
      (record) => {
        if (!record?.type) return
        if (record.type === 'error') {
          streamError = new Error(record.message || 'Search failed')
          return
        }
        if (onEvent) onEvent(record)
        if (record.type === 'graph_complete' && record.nodes) {
          merged = {
            ...(merged || {}),
            nodes: record.nodes,
            links: record.links || [],
            status: 'complete',
          }
        }
        if (record.type === 'society_ready' && record.society_id) {
          merged = { ...(merged || {}), society_id: record.society_id }
        }
      },
      { signal }
    )

    if (streamError) throw streamError
    if (!merged?.society_id || !merged.nodes?.length) {
      throw new Error('Stream ended without a complete society payload')
    }

    return {
      society_id: merged.society_id,
      status: merged.status || 'complete',
      nodes: merged.nodes,
      links: merged.links || [],
      metadata: { total_personas: merged.nodes.length },
    }
  },

  /**
   * Get a previously generated society (used by the live polling fallback).
   *
   * @param {string} societyId
   * @returns {Promise<Object>}
   */
  async getSocietyStatus(societyId) {
    const response = await apiClient.get(`/society/${societyId}/status`)
    return response.data
  },

  /**
   * Run a simulation on a society
   *
   * @param {Object} config
   * @returns {Promise<Object>}
   */
  async runSimulation(config) {
    const response = await apiClient.post('/simulate', config)
    return response.data
  },

  /**
   * Stream a simulation over **POST /api/simulate/stream** using `fetch` (not axios).
   *
   * @param {Object} config
   * @param {{ onStatus?: (d: object) => void, onNarrativeDelta?: (d: { text: string }) => void, onComplete?: (d: object) => void, onError?: (d: { message: string }) => void }} handlers
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<object|null>}
   */
  async runSimulationStream(config, handlers = {}, options = {}) {
    const { signal } = options
    const { onStatus, onNarrativeDelta, onComplete, onError } = handlers

    const res = await fetch(`${API_BASE_URL}/simulate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(config),
      signal,
    })

    if (!res.ok || !res.body) {
      let msg = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson?.error) msg = errJson.error
      } catch {
        try {
          const t = await res.text()
          if (t) msg = t.slice(0, 200)
        } catch {
          /* ignore */
        }
      }
      const err = { message: msg }
      onError?.(err)
      throw new Error(msg)
    }

    const reader = res.body.getReader()
    let completePayload = null

    try {
      await consumeFramedSseReader(
        reader,
        (event, data) => {
          if (event === 'complete' && data?.simulation) {
            completePayload = data
            onComplete?.(data)
            return
          }
          if (!data && event !== 'status') return
          switch (event) {
            case 'status':
              onStatus?.(data || {})
              break
            case 'narrative_delta':
              if (data?.text) onNarrativeDelta?.(data)
              break
            case 'error':
              onError?.(data || { message: 'Stream error' })
              break
            default:
              break
          }
        },
        { signal }
      )
    } catch (e) {
      if (signal?.aborted) {
        return completePayload
      }
      throw e
    }

    if (!completePayload && !signal?.aborted) {
      const err = new Error('Stream ended without a complete payload')
      onError?.({ message: err.message })
      throw err
    }

    return completePayload
  },

  /**
   * Stream per-persona reactions: **POST /api/simulate/personas-stream** (framed SSE).
   *
   * @param {Object} config — society_id, idea_prompt | content, society_snapshot?, conversation?, persona_sample_cap? (optional; omit to run all graph nodes up to server max)
   * @param {{
   *   onStatus?: (d: object) => void,
   *   onPersonaStart?: (d: { persona_id: string }) => void,
   *   onPersonaComplete?: (d: object) => void,
   *   onSummary?: (d: object) => void,
   *   onComplete?: (d: object) => void,
   *   onError?: (d: { message: string }) => void,
   * }} handlers
   * @param {{ signal?: AbortSignal }} [options]
   */
  async runPersonasSimulationStream(config, handlers = {}, options = {}) {
    const { signal } = options
    const {
      onStatus,
      onPersonaStart,
      onPersonaComplete,
      onSummary,
      onComplete,
      onError,
    } = handlers

    const res = await fetch(`${API_BASE_URL}/simulate/personas-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(config),
      signal,
    })

    if (!res.ok || !res.body) {
      let msg = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson?.error) msg = errJson.error
      } catch {
        try {
          const t = await res.text()
          if (t) msg = t.slice(0, 200)
        } catch {
          /* ignore */
        }
      }
      onError?.({ message: msg })
      throw new Error(msg)
    }

    const reader = res.body.getReader()
    let completePayload = null
    let sawSummary = false

    try {
      await consumeFramedSseReader(
        reader,
        (event, data) => {
          switch (event) {
            case 'status':
              onStatus?.(data || {})
              break
            case 'persona_start':
              onPersonaStart?.(data || {})
              break
            case 'persona_complete':
              onPersonaComplete?.(data || {})
              break
            case 'summary':
              sawSummary = true
              onSummary?.(data || {})
              break
            case 'complete':
              completePayload = data
              onComplete?.(data || {})
              break
            case 'error':
              onError?.(data || { message: 'Stream error' })
              break
            default:
              break
          }
        },
        { signal }
      )
    } catch (e) {
      if (signal?.aborted) {
        return completePayload
      }
      throw e
    }

    if (!sawSummary && !signal?.aborted) {
      const err = new Error('Stream ended without a summary payload')
      onError?.({ message: err.message })
      throw err
    }

    return completePayload
  },

  async testPersona({ persona, prompt }) {
    const response = await apiClient.post('/persona/respond', { persona, prompt })
    return response.data
  },

  async healthCheck() {
    const response = await apiClient.get('/health')
    return response.data
  },
}

export default api
