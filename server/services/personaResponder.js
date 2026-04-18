import { callClaudeSonnet } from '../utils/anthropic.js'
import { getPersonaResponsePrompt } from '../prompts/personaResponse.js'

export async function respondAsPersona({ persona, prompt }) {
  const claudePrompt = getPersonaResponsePrompt(persona, prompt)

  try {
    const response = await callClaudeSonnet(claudePrompt)

    if (typeof response !== 'object' || Array.isArray(response)) {
      throw new Error('Invalid response format')
    }

    return response
  } catch (error) {
    console.error('Error getting persona response:', error)

    return {
      reaction: 'neutral',
      action: 'ignore',
      sentiment_score: 0,
      quote: 'Interesting.',
      would_share: false,
      reasoning: 'Fallback response due to processing error.',
    }
  }
}
