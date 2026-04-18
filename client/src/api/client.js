import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Society Builder streaming: when `VITE_PIPELINE_LIVE` is not `"true"`, the UI
 * runs a client-side simulated pipeline (no POST /society/search required).
 * Set `VITE_PIPELINE_LIVE=true` to call `searchLinkedIn` and WebSocket/polling instead.
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
   * Search LinkedIn and generate society (NEW SIMPLIFIED API)
   *
   * @param {string} query - Natural language description of target audience
   *
   * @returns {Promise<Object>} Response format:
   * {
   *   society_id: string,
   *   status: 'processing' | 'complete',
   *   message: string
   * }
   */
  async searchLinkedIn(query) {
    const response = await apiClient.post('/society/search', { query })
    return response.data
  },

  /**
   * Get society status (for polling, WebSocket is preferred)
   *
   * @param {string} societyId - ID of the society
   *
   * @returns {Promise<Object>} Response format:
   * {
   *   society_id: string,
   *   status: 'processing' | 'complete',
   *   profiles: Array<Profile>,
   *   personas: Array<Persona>,
   *   graphState: Object
   * }
   */
  async getSocietyStatus(societyId) {
    const response = await apiClient.get(`/society/${societyId}/status`)
    return response.data
  },

  /**
   * LEGACY: Generate a society of AI personas (DEPRECATED - use searchLinkedIn)
   *
   * @param {Object} config
   * @param {string} config.mode - 'describe' | 'linkedin'
   * @param {string} [config.description] - For 'describe' mode
   * @param {Array<string>} [config.linkedin_urls] - For 'linkedin' mode
   * @param {number} [config.persona_count] - Total personas to generate
   * @param {number} [config.supplement_count] - For 'linkedin' mode, how many to generate
   *
   * @returns {Promise<Object>}
   */
  async generateSociety(config) {
    const response = await apiClient.post('/society/generate', config)
    return response.data
  },

  /**
   * Run a simulation on a society
   *
   * @param {Object} config
   * @param {string} config.society_id - ID of the society
   * @param {string} config.content - The startup idea/pitch to test
   * @param {string} [config.seed_strategy] - 'auto' | 'influencers' | 'random'
   *
   * @returns {Promise<Object>} Response format:
   * {
   *   steps: Array<{
   *     step: number,
   *     reactions: Array<{
   *       agent_id: string,
   *       reaction: 'positive' | 'negative' | 'neutral',
   *       action: 'share' | 'engage' | 'debate' | 'ignore',
   *       sentiment: number, // -1 to 1
   *       quote: string,
   *       influenced_by: string | null
   *     }>
   *   }>,
   *   summary: {
   *     adoption_rate: number, // 0-1
   *     positive_count: number,
   *     negative_count: number,
   *     neutral_count: number,
   *     top_quotes: Array<{ persona: string, archetype: string, quote: string }>,
   *     clusters: Object // cluster performance data
   *   }
   * }
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
