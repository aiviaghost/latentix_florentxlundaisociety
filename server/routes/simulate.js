import express from 'express'
import { runSimulation } from '../services/simulationEngine.js'

const router = express.Router()

/**
 * POST /api/simulate
 *
 * Body:
 * {
 *   society_id: string,
 *   content?: string,           // idea / pitch (legacy)
 *   idea_prompt?: string,       // preferred alias for content
 *   seed_strategy?: 'auto' | 'influencers' | 'random', // optional; ignored by engine
 *   society_snapshot?: { nodes: Array, links: Array }  // when society_id not in server store (e.g. sim_*)
 * }
 *
 * Response: { society_id, simulation: { headline, narrative, quotes, metrics }, graph }
 * The main UI uses **POST /api/simulate/personas-stream** for incremental persona reactions; this route is a single-shot summary fallback.
 */
router.post('/', async (req, res, next) => {
  try {
    const { society_id, content, idea_prompt, seed_strategy, society_snapshot } = req.body

    if (!society_id) {
      return res.status(400).json({ error: 'society_id is required' })
    }

    const promptText = (idea_prompt || content || '').trim()
    if (!promptText) {
      return res.status(400).json({ error: 'content or idea_prompt is required' })
    }

    console.log(
      `Running simulation: society_id=${society_id}, seed_strategy=${seed_strategy || 'auto'}, snapshot=${!!society_snapshot}`
    )

    const results = await runSimulation({
      society_id,
      content: promptText,
      idea_prompt: promptText,
      seed_strategy: seed_strategy || 'auto',
      society_snapshot,
    })

    res.json(results)
  } catch (error) {
    next(error)
  }
})

export default router
