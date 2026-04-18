/**
 * When true, Society Builder uses real POST /society/search + WebSocket/polling.
 * Default is simulated pipeline (no new backend routes required).
 */
export function isPipelineLive() {
  return import.meta.env.VITE_PIPELINE_LIVE === 'true'
}
