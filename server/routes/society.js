import express from 'express'
import { generateAudience, getSociety } from '../services/societyGenerator.js'

const router = express.Router()

/**
 * POST /api/society/search
 *
 * Generate an audience from a natural-language description using cached profiles.
 *
 * Body: { query: string, persona_count?: number }
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, persona_count } = req.body

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required' })
    }

    console.log(`Generating audience for query: "${query}"`)

    const society = await generateAudience({
      description: query,
      persona_count: persona_count || 30,
    })

    res.json(society)
  } catch (error) {
    next(error)
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
