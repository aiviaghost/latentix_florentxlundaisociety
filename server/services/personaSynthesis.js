import { callClaudeHaiku } from '../utils/anthropic.js'
import { getSocietyGenerationPrompt, getLinkedInPersonaSynthesisPrompt } from '../prompts/personaSynthesis.js'

/**
 * Synthesize personas from a text description
 */
export async function synthesizePersonasFromDescription(description, count) {
  const prompt = getSocietyGenerationPrompt(description, count)

  try {
    const response = await callClaudeHaiku(prompt)

    // Expected response format: { personas: [...], connections: [...] }
    if (!response.personas || !Array.isArray(response.personas)) {
      throw new Error('Invalid response format from LLM')
    }

    return response.personas
  } catch (error) {
    console.error('Error synthesizing personas:', error)

    // Fallback: Return mock personas
    console.warn('Using fallback mock personas')
    return generateMockPersonas(count)
  }
}

/**
 * Synthesize a persona from LinkedIn profile data
 */
export async function synthesizePersonaFromLinkedIn(profileData) {
  const prompt = getLinkedInPersonaSynthesisPrompt(profileData)

  try {
    const persona = await callClaudeHaiku(prompt)
    return persona
  } catch (error) {
    console.error('Error synthesizing LinkedIn persona:', error)
    return null
  }
}

/**
 * Fallback: Generate mock personas for testing
 */
function generateMockPersonas(count) {
  const archetypes = [
    { name: 'Tech Founder', color: '#3b82f6', risk: 0.8, innovation: 0.9 },
    { name: 'Product Leader', color: '#8b5cf6', risk: 0.6, innovation: 0.8 },
    { name: 'Investor', color: '#ec4899', risk: 0.4, innovation: 0.6 },
    { name: 'Developer', color: '#10b981', risk: 0.5, innovation: 0.7 },
    { name: 'Designer', color: '#f59e0b', risk: 0.6, innovation: 0.8 },
    { name: 'Skeptic', color: '#ef4444', risk: 0.2, innovation: 0.3 },
    { name: 'Enterprise Buyer', color: '#6366f1', risk: 0.3, innovation: 0.4 },
    { name: 'Early Adopter', color: '#14b8a6', risk: 0.9, innovation: 0.9 },
  ]

  const personas = []

  for (let i = 0; i < count; i++) {
    const archetype = archetypes[i % archetypes.length]
    const variance = () => (Math.random() - 0.5) * 0.3 // ±15%

    personas.push({
      id: `p_${i}`,
      display_name: `Person ${String.fromCharCode(65 + (i % 26))}.`,
      archetype: archetype.name,
      role: `${archetype.name} #${i}`,
      company_type: i % 3 === 0 ? 'startup' : i % 3 === 1 ? 'enterprise' : 'vc',
      color: archetype.color,
      traits: {
        risk_tolerance: Math.max(0, Math.min(1, archetype.risk + variance())),
        price_sensitivity: Math.random(),
        innovation_openness: Math.max(0, Math.min(1, archetype.innovation + variance())),
        social_influence: Math.random(),
        tech_savviness: Math.random(),
        domain_expertise: ['tech', 'saas'],
      },
      behavioral_summary: `A ${archetype.name} with typical behavior patterns.`,
      connection_tags: [archetype.name.toLowerCase().replace(' ', '-')],
    })
  }

  return personas
}
