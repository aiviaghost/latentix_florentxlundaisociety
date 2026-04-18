import express from 'express'
import { resolveSociety } from '../services/simulationEngine.js'
import { runPersonaBatchSimulation } from '../services/personaBatchSimulation.js'

const router = express.Router()

function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/**
 * POST /api/simulate/personas-stream
 *
 * Body: society_id, idea_prompt | content, society_snapshot?, conversation?, persona_sample_cap? (optional positive int; omit to sample all nodes up to server max)
 *
 * SSE events:
 * - status — { phase: "started" }
 * - persona_start — { persona_id }
 * - persona_complete — { persona_id, name, quote, reaction, sentiment_score, ... }
 * - summary — { headline, narrative, quotes, metrics, society_id, persona_count }
 * - complete — { society_id, aggregate: { persona_count } }
 * - error — { message }
 */
router.post('/', async (req, res) => {
  const { society_id, content, idea_prompt, society_snapshot, conversation, persona_sample_cap } = req.body || {}

  if (!society_id) {
    return res.status(400).json({ error: 'society_id is required' })
  }

  const promptText = (idea_prompt || content || '').trim()
  if (!promptText) {
    return res.status(400).json({ error: 'content or idea_prompt is required' })
  }

  const society = resolveSociety(society_id, society_snapshot)
  if (!society) {
    return res.status(404).json({
      error: `Society not found: ${society_id}. Provide society_snapshot for client-only societies.`,
    })
  }

  const abort = new AbortController()
  const onResClose = () => {
    if (!res.writableEnded) {
      abort.abort()
    }
  }
  res.on('close', onResClose)

  const teardown = () => res.off('close', onResClose)

  try {
    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    sseWrite(res, 'status', { phase: 'started' })

    const cap =
      persona_sample_cap != null && Number.isFinite(Number(persona_sample_cap)) && Number(persona_sample_cap) > 0
        ? Math.floor(Number(persona_sample_cap))
        : null

    const batch = await runPersonaBatchSimulation(
      {
        society,
        idea_prompt: promptText,
        conversation: Array.isArray(conversation) ? conversation : [],
        signal: abort.signal,
        cap,
      },
      {
        onPersonaStart: (d) => sseWrite(res, 'persona_start', d),
        onPersonaComplete: (d) => sseWrite(res, 'persona_complete', d),
        onSummary: (d) => sseWrite(res, 'summary', d),
      }
    )

    if (!res.writableEnded && batch && !abort.signal.aborted) {
      sseWrite(res, 'complete', {
        society_id,
        aggregate: { persona_count: batch.results.length },
      })
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('personas-stream failed:', error)
      if (!res.writableEnded) {
        sseWrite(res, 'error', { message: error.message || 'Stream failed' })
      }
    }
  } finally {
    teardown()
    if (!res.writableEnded) {
      res.end()
    }
  }
})

export default router
