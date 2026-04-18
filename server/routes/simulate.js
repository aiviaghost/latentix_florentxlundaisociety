import express from 'express'
import { runSimulation } from '../services/simulationEngine.js'

const router = express.Router()

/**
 * POST /api/simulate
 *
 * Run a simulation on a generated society
 *
 * Body:
 * {
 *   society_id: string,
 *   content: string,
 *   seed_strategy?: 'auto' | 'influencers' | 'random'
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { society_id, content, seed_strategy } = req.body

    // Validation
    if (!society_id) {
      return res.status(400).json({ error: 'society_id is required' })
    }

    if (!content) {
      return res.status(400).json({ error: 'content is required' })
    }

    console.log(`Running simulation: society_id=${society_id}, seed_strategy=${seed_strategy || 'auto'}`)

    const results = await runSimulation({
      society_id,
      content,
      seed_strategy: seed_strategy || 'auto',
    })

    res.json(results)
  } catch (error) {
    next(error)
  }
})

export default router
