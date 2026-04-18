import express from 'express'
import { generateSociety } from '../services/societyGenerator.js'

const router = express.Router()

/**
 * POST /api/society/generate
 *
 * Generate a society of AI personas
 *
 * Body:
 * {
 *   mode: 'describe' | 'linkedin',
 *   description?: string,
 *   linkedin_urls?: string[],
 *   persona_count?: number,
 *   supplement_count?: number
 * }
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { mode, description, linkedin_urls, persona_count, supplement_count } = req.body

    // Validation
    if (!mode || !['describe', 'linkedin'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "describe" or "linkedin"' })
    }

    if (mode === 'describe' && !description) {
      return res.status(400).json({ error: 'Description required for describe mode' })
    }

    if (mode === 'linkedin' && (!linkedin_urls || linkedin_urls.length === 0)) {
      return res.status(400).json({ error: 'LinkedIn URLs required for linkedin mode' })
    }

    console.log(`Generating society: mode=${mode}, persona_count=${persona_count || 30}`)

    const society = await generateSociety({
      mode,
      description,
      linkedin_urls,
      persona_count: persona_count || 30,
      supplement_count,
    })

    res.json(society)
  } catch (error) {
    next(error)
  }
})

export default router
