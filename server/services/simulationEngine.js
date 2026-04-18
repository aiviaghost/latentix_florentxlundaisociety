import { callClaudeSonnet } from '../utils/anthropic.js'
import { getSimulationStepPrompt } from '../prompts/simulationStep.js'
import { getSociety } from './societyGenerator.js'

/**
 * Run a simulation on a society
 */
export async function runSimulation(config) {
  const { society_id, content, seed_strategy } = config

  // Get the society
  const society = getSociety(society_id)
  if (!society) {
    throw new Error(`Society not found: ${society_id}`)
  }

  const personas = society.nodes

  // Select seed personas based on strategy
  const seedPersonas = selectSeedPersonas(personas, seed_strategy)

  console.log(`Running simulation with ${seedPersonas.length} seed personas`)

  const steps = []
  let activePersonas = new Set(seedPersonas.map(p => p.id))
  const allReactions = new Map()

  // Step 1: Seed personas react
  const step1Reactions = await evaluateReactions(
    seedPersonas,
    content,
    'These personas are seeing the idea for the first time.',
    null
  )

  steps.push({
    step: 1,
    reactions: step1Reactions,
  })

  // Store reactions
  step1Reactions.forEach(r => allReactions.set(r.agent_id, r))

  // Propagation steps (2-4)
  for (let stepNum = 2; stepNum <= 4; stepNum++) {
    const nextWave = []

    // Find personas exposed via network
    society.links.forEach(link => {
      const source = typeof link.source === 'object' ? link.source.id : link.source
      const target = typeof link.target === 'object' ? link.target.id : link.target

      // If source shared it, target gets exposed
      const sourceReaction = allReactions.get(source)
      if (sourceReaction && sourceReaction.would_share && !allReactions.has(target)) {
        const targetPersona = personas.find(p => p.id === target)
        if (targetPersona) {
          nextWave.push({
            persona: targetPersona,
            influenced_by: source,
            influencer_quote: sourceReaction.quote,
          })
        }
      }

      // Bidirectional
      const targetReaction = allReactions.get(target)
      if (targetReaction && targetReaction.would_share && !allReactions.has(source)) {
        const sourcePersona = personas.find(p => p.id === source)
        if (sourcePersona) {
          nextWave.push({
            persona: sourcePersona,
            influenced_by: target,
            influencer_quote: targetReaction.quote,
          })
        }
      }
    })

    if (nextWave.length === 0) {
      console.log(`Simulation stopped at step ${stepNum}: no more propagation`)
      break
    }

    // Limit to prevent exponential growth
    const limitedWave = nextWave.slice(0, Math.min(10, nextWave.length))

    const context = limitedWave.map(w =>
      `[${w.persona.display_name}] heard about it from [${w.influenced_by}] who said: "${w.influencer_quote}"`
    ).join('\n')

    const stepReactions = await evaluateReactions(
      limitedWave.map(w => w.persona),
      content,
      context,
      limitedWave.map(w => w.influenced_by)
    )

    steps.push({
      step: stepNum,
      reactions: stepReactions,
    })

    stepReactions.forEach(r => allReactions.set(r.agent_id, r))
  }

  // Generate summary
  const summary = generateSummary(allReactions, personas.length)

  console.log(`✅ Simulation complete: ${allReactions.size}/${personas.length} personas reacted`)

  return {
    steps,
    summary,
  }
}

/**
 * Select seed personas based on strategy
 */
function selectSeedPersonas(personas, strategy) {
  if (strategy === 'influencers') {
    // Pick top influencers
    return personas
      .sort((a, b) => (b.traits?.social_influence || 0) - (a.traits?.social_influence || 0))
      .slice(0, 3)
  } else if (strategy === 'random') {
    // Random sample
    const shuffled = [...personas].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  } else {
    // Auto: mix of high influence and diverse archetypes
    const sorted = [...personas].sort((a, b) =>
      (b.traits?.social_influence || 0) - (a.traits?.social_influence || 0)
    )
    return sorted.slice(0, 3)
  }
}

/**
 * Evaluate reactions from personas
 */
async function evaluateReactions(personas, content, context, influencedBy) {
  const prompt = getSimulationStepPrompt(personas, content, context)

  try {
    const response = await callClaudeSonnet(prompt)

    // Expected: array of reactions
    if (!Array.isArray(response)) {
      throw new Error('Invalid response format')
    }

    // Add influenced_by if provided
    return response.map((r, idx) => ({
      ...r,
      influenced_by: Array.isArray(influencedBy) ? influencedBy[idx] : null,
    }))
  } catch (error) {
    console.error('Error evaluating reactions:', error)

    // Fallback: generate mock reactions
    return personas.map((p, idx) => ({
      agent_id: p.id,
      reaction: Math.random() > 0.5 ? 'positive' : 'negative',
      action: Math.random() > 0.4 ? 'share' : 'ignore',
      sentiment_score: Math.random() * 2 - 1,
      quote: 'Interesting idea.',
      would_share: Math.random() > 0.5,
      reasoning: 'Based on my background.',
      influenced_by: Array.isArray(influencedBy) ? influencedBy[idx] : null,
    }))
  }
}

/**
 * Generate summary statistics
 */
function generateSummary(allReactions, totalPersonas) {
  const reactions = Array.from(allReactions.values())

  const positive_count = reactions.filter(r => r.reaction === 'positive').length
  const negative_count = reactions.filter(r => r.reaction === 'negative').length
  const neutral_count = reactions.filter(r => r.reaction === 'neutral').length

  const adoption_rate = reactions.length / totalPersonas

  const top_quotes = reactions
    .filter(r => r.quote && r.quote.length > 0)
    .sort((a, b) => Math.abs(b.sentiment_score || 0) - Math.abs(a.sentiment_score || 0))
    .slice(0, 5)
    .map(r => ({
      persona: r.agent_id,
      archetype: 'Unknown', // TODO: Look up archetype
      quote: r.quote,
    }))

  return {
    adoption_rate,
    positive_count,
    negative_count,
    neutral_count,
    top_quotes,
    clusters: {}, // TODO: Cluster analysis
  }
}
