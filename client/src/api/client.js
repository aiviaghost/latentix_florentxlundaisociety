import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Society Builder streaming: when `VITE_PIPELINE_LIVE` is not `"true"`, the UI
 * runs a client-side simulated pipeline (no POST /society/search required).
 * Set `VITE_PIPELINE_LIVE=true` to call `generateAudience` and WebSocket/polling instead.
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
 * Backend team (Person B) should implement these exact endpoints and response formats.
 */

const api = {
  /**
   * Generate an audience from a natural-language description.
   *
   * @param {string} query - Natural language description of target audience
   * @param {number} [persona_count]
   *
   * @returns {Promise<Object>} { society_id, status, nodes, links, metadata }
   */
  async generateAudience(query, persona_count) {
    const response = await apiClient.post('/society/search', { query, persona_count })
    return response.data
  },

  /**
   * Get a previously generated society (used by live polling fallback).
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
   * @param {string} config.society_id - ID of the society
   * @param {string} [config.content] - Idea / pitch (legacy; use idea_prompt preferred)
   * @param {string} [config.idea_prompt] - Idea or message to test
   * @param {string} [config.seed_strategy] - ignored by current server (kept for compatibility)
   * @param {{ nodes: Array, links: Array }} [config.society_snapshot] - When society_id is not
   *   stored server-side (e.g. client sim_*), send the graph from the builder.
   *
   * @returns {Promise<Object>} Response format:
   * {
   *   society_id: string,
   *   simulation: {
   *     headline: string,
   *     narrative: string,
   *     quotes: Array<{ persona_id?: string, name: string, archetype?: string, quote: string, sentiment?: string }>,
   *     metrics?: { adoption_rate?: number, positive_count?: number, negative_count?: number, neutral_count?: number }
   *   },
   *   graph: { nodes, links }
   * }
   * Playback / 3D highlights are generated on the client from `graph` + `simulation.quotes`.
   */
  async runSimulation(config) {
    const response = await apiClient.post('/simulate', config)
    return response.data
  },

  /**
   * Test a single persona against a prompt (for A/B testing)
   *
   * @param {Object} config
   * @param {Object} config.persona - Persona object with traits, archetype, etc.
   * @param {string} config.prompt - The idea, message, or copy to test
   *
   * @returns {Promise<Object>} Response format:
   * {
   *   reaction: 'positive' | 'negative' | 'neutral',
   *   action: 'share' | 'engage' | 'debate' | 'ignore',
   *   sentiment_score: number,  // -1.0 to 1.0
   *   quote: string,
   *   would_share: boolean,
   *   reasoning: string
   * }
   */
  async testPersona({ persona, prompt }) {
    const response = await apiClient.post('/persona/respond', { persona, prompt })
    return response.data
  },

  /**
   * Health check
   */
  async healthCheck() {
    const response = await apiClient.get('/health')
    return response.data
  },
}

export default api
