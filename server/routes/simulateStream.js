import express from 'express'
import { runSimulationStream } from '../services/simulationStreamEngine.js'

const router = express.Router()

/**
 * Write one SSE frame (event + JSON data).
 * @param {import('express').Response} res
 * @param {string} event
 * @param {object} data
 */
function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/**
 * POST /api/simulate/stream
 *
 * Body (same as POST /api/simulate, plus optional conversation):
 * - society_id (required)
 * - idea_prompt | content (required)
 * - society_snapshot (optional; required for client-only societies)
 * - conversation (optional): Array<{ role: 'user'|'assistant', content: string }>
 *
 * Response: text/event-stream
 * - event: status — data: { phase: "started" }
 * - event: narrative_delta — data: { text: string } (append client-side)
 * - event: complete — data: { society_id, simulation, graph } (graph often empty; client keeps snapshot)
 * - event: error — data: { message: string }
 */
router.post('/', async (req, res) => {
  const abort = new AbortController()
  // Do not use req.on('close'): it can fire when the request body is fully read, aborting the
  // model stream before the SSE response finishes. Only abort if the client drops the response.
  const onResClose = () => {
    if (!res.writableEnded) {
      abort.abort()
    }
  }
  res.on('close', onResClose)

  const teardown = () => res.off('close', onResClose)

  try {
    const { society_id, content, idea_prompt, society_snapshot, conversation } = req.body || {}

    if (!society_id) {
      res.status(400).json({ error: 'society_id is required' })
      return
    }

    const promptText = (idea_prompt || content || '').trim()
    if (!promptText) {
      res.status(400).json({ error: 'content or idea_prompt is required' })
      return
    }

    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    sseWrite(res, 'status', { phase: 'started' })

    const payload = await runSimulationStream(
      {
        society_id,
        content: promptText,
        idea_prompt: promptText,
        society_snapshot,
        conversation,
      },
      {
        signal: abort.signal,
        onNarrativeDelta: (text) => {
          if (text) sseWrite(res, 'narrative_delta', { text })
        },
      }
    )

    // Omit graph from SSE: graph can be huge (breaks JSON.parse / frame limits); client keeps snapshot.
    sseWrite(res, 'complete', {
      society_id: payload.society_id,
      simulation: payload.simulation,
      graph: { nodes: [], links: [] },
    })
    res.end()
  } catch (error) {
    const aborted =
      abort.signal.aborted ||
      error?.name === 'APIUserAbortError' ||
      error?.name === 'AbortError'
    if (aborted && res.headersSent) {
      try {
        res.end()
      } catch {
        res.destroy()
      }
      return
    }

    const message = error?.message || 'Internal stream error'
    if (!res.headersSent) {
      res.status(500).json({ error: message })
    } else {
      try {
        sseWrite(res, 'error', { message })
        res.end()
      } catch {
        res.destroy()
      }
    }
  } finally {
    teardown()
  }
})

export default router
