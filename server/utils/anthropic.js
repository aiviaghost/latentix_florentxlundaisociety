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
    model = 'claude-sonnet-4-6',
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
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 4000,
    temperature: 1.0,
  })
}

/**
 * Call Claude Sonnet (balanced, for simulation)
 */
export async function callClaudeSonnet(prompt) {
  return callClaudeJSON(prompt, {
    model: 'claude-sonnet-4-6',
    maxTokens: 4000,
    temperature: 1.0,
  })
}

const SONNET_STREAM_DEFAULTS = {
  model: 'claude-sonnet-4-6',
  maxTokens: 4000,
  temperature: 1.0,
}

/**
 * Stream assistant text from Claude Sonnet. Invokes onTextDelta with incremental text chunks.
 * Resolves with the full concatenated assistant text when the stream completes.
 *
 * @param {{ prompt: string, onTextDelta?: (chunk: string) => void, signal?: AbortSignal }} opts
 * @returns {Promise<string>}
 */
export async function streamClaudeSonnetText({ prompt, onTextDelta, signal } = {}) {
  const anthropic = getAnthropicClient()

  const stream = anthropic.messages.stream(
    {
      model: SONNET_STREAM_DEFAULTS.model,
      max_tokens: SONNET_STREAM_DEFAULTS.maxTokens,
      temperature: SONNET_STREAM_DEFAULTS.temperature,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal }
  )

  return new Promise((resolve, reject) => {
    stream.on('text', (delta) => {
      if (delta && onTextDelta) onTextDelta(delta)
    })
    stream.on('error', (err) => reject(err))
    stream
      .finalText()
      .then((text) => resolve(text || ''))
      .catch(reject)
  })
}
