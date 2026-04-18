import express from 'express'
import { generateAudience, getSociety } from '../services/societyGenerator.js'

const router = express.Router()

/**
 * POST /api/society/search
 *
 * Generate an audience from a natural-language description using cached profiles.
 * Response: text/event-stream; each event is `data: { "type": "...", ... }\n\n`.
 *
 * Body: { query: string, persona_count?: number }
 */
router.post('/search', async (req, res) => {
  const { query, persona_count } = req.body

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' })
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
    console.log(`Generating audience for query: "${query}"`)

    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    const emit = (type, data) => {
      if (res.writableEnded || abort.signal.aborted) return
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
    }

    await generateAudience({
      description: query,
      persona_count: persona_count || 30,
      onEvent: emit,
      signal: abort.signal,
    })
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('generateAudience failed:', error)
      if (!res.writableEnded) {
        try {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: error.message || 'Search failed' })}\n\n`
          )
        } catch {
          /* ignore */
        }
      }
    }
  } finally {
    teardown()
    if (!res.writableEnded) {
      res.end()
    }
  }
})

/**
 * GET /api/society/:societyId/status
 *
 * Returns a previously generated society (used by the live polling fallback).
 */
router.get('/:societyId/status', (req, res) => {
  const society = getSociety(req.params.societyId)
  if (!society) {
    return res.status(404).json({ error: 'Society not found' })
  }
  res.json({ ...society, status: 'complete' })
})

export default router
