import express from 'express'
import { respondAsPersona } from '../services/personaResponder.js'

const router = express.Router()

/**
 * POST /api/persona/respond
 *
 * Get a single persona's reaction to a prompt (for A/B testing)
 *
 * Body:
 * {
 *   persona: object,
 *   prompt: string
 * }
 *
 * Response:
 * {
 *   reaction: 'positive' | 'negative' | 'neutral',
 *   action: 'share' | 'engage' | 'debate' | 'ignore',
 *   sentiment_score: number,  // -1.0 to 1.0
 *   quote: string,
 *   would_share: boolean,
 *   reasoning: string
 * }
 */
router.post('/respond', async (req, res, next) => {
  try {
    const { persona, prompt } = req.body

    if (!persona || typeof persona !== 'object') {
      return res.status(400).json({ error: 'persona is required and must be an object' })
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt is required and must be a non-empty string' })
    }

    console.log(`Persona respond: persona=${persona.display_name || persona.name || persona.id}`)

    const result = await respondAsPersona({ persona, prompt: prompt.trim() })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
