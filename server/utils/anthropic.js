import Anthropic from '@anthropic-ai/sdk'

let client = null

/**
 * Get or create Anthropic client
 */
export function getAnthropicClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
    }

    client = new Anthropic({
      apiKey,
    })
  }

  return client
}

/**
 * Call Claude with JSON response
 */
export async function callClaudeJSON(prompt, options = {}) {
  const anthropic = getAnthropicClient()

  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 4000,
    temperature = 1.0,
  } = options

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0].text

    // Try to parse JSON response
    try {
      return JSON.parse(content)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      console.error('Failed to parse Claude response as JSON:', content)
      throw new Error('Claude response was not valid JSON')
    }
  } catch (error) {
    console.error('Error calling Claude:', error)
    throw error
  }
}

/**
 * Call Claude Haiku (fast, for persona synthesis)
 */
export async function callClaudeHaiku(prompt) {
  return callClaudeJSON(prompt, {
    model: 'claude-3-5-haiku-20241022',
    maxTokens: 4000,
    temperature: 1.0,
  })
}

/**
 * Call Claude Sonnet (balanced, for simulation)
 */
export async function callClaudeSonnet(prompt) {
  return callClaudeJSON(prompt, {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    temperature: 1.0,
  })
}
