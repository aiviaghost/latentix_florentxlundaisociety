import { streamClaudeSonnetText } from '../utils/anthropic.js'
import {
  getSimulationStreamPrompt,
  SIMULATION_STREAM_JSON_DELIM,
} from '../prompts/simulationSummaryStream.js'
import {
  resolveSociety,
  compactSocietyForPrompt,
  normalizeSimulation,
  mockSimulation,
} from './simulationEngine.js'

function parseJsonLoose(text) {
  const trimmed = (text || '').trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) return JSON.parse(jsonMatch[1])
    const brace = trimmed.indexOf('{')
    if (brace >= 0) {
      const slice = trimmed.slice(brace)
      return JSON.parse(slice)
    }
    return null
  }
}

/**
 * Split streamed assistant output into narrative (before delimiter) and JSON tail.
 * Emits narrative deltas only for text confirmed before the delimiter (holds back a suffix until delim is ruled out).
 */
export function createSimulationStreamSplitter(delimiter, onNarrativeDelta) {
  let buf = ''
  let narrSent = 0
  let delimFound = false

  return {
    push(chunk) {
      if (!chunk) return
      buf += chunk
      if (delimFound) return

      const i = buf.indexOf(delimiter)
      if (i === -1) {
        const hold = Math.max(0, delimiter.length - 1)
        const safeEnd = buf.length - hold
        if (safeEnd > narrSent) {
          const piece = buf.slice(narrSent, safeEnd)
          narrSent = safeEnd
          if (piece) onNarrativeDelta(piece)
        }
      } else {
        if (i > narrSent) {
          const piece = buf.slice(narrSent, i)
          narrSent = i
          if (piece) onNarrativeDelta(piece)
        }
        delimFound = true
      }
    },
    finish() {
      const i = buf.indexOf(delimiter)
      if (i === -1) {
        const tail = buf.slice(narrSent)
        if (tail) onNarrativeDelta(tail)
        narrSent = buf.length
        return { narrative: buf.trim(), jsonText: '' }
      }
      const narrative = buf.slice(0, i).trim()
      const jsonText = buf.slice(i + delimiter.length).trim()
      return { narrative, jsonText }
    },
  }
}

/**
 * Run streaming simulation: narrative deltas via callback, returns final payload matching POST /api/simulate.
 *
 * @param {object} config
 * @param {{ onNarrativeDelta?: (s: string) => void, signal?: AbortSignal }} opts
 * @returns {Promise<{ society_id: string, simulation: object, graph: object }>}
 */
export async function runSimulationStream(config, opts = {}) {
  const { onNarrativeDelta, signal } = opts
  const { society_id, content, idea_prompt, society_snapshot, conversation } = config

  const promptText = (idea_prompt || content || '').trim()
  if (!promptText) {
    throw new Error('content or idea_prompt is required')
  }

  const society = resolveSociety(society_id, society_snapshot)
  if (!society) {
    throw new Error(
      `Society not found: ${society_id}. Provide society_snapshot with nodes and links for client-only societies.`
    )
  }

  const compact = compactSocietyForPrompt(society)
  const prompt = getSimulationStreamPrompt(promptText, compact, conversation)

  const splitter = createSimulationStreamSplitter(SIMULATION_STREAM_JSON_DELIM, (piece) => {
    if (onNarrativeDelta) onNarrativeDelta(piece)
  })

  try {
    await streamClaudeSonnetText({
      prompt,
      signal,
      onTextDelta: (delta) => {
        splitter.push(delta)
      },
    })
  } catch (err) {
    const aborted =
      signal?.aborted ||
      err?.name === 'APIUserAbortError' ||
      err?.name === 'AbortError'
    if (aborted) {
      throw err
    }
    console.warn('Simulation stream failed:', err?.message || err)
    const mock = normalizeSimulation(mockSimulation(society, promptText), society)
    return {
      society_id,
      simulation: mock,
      graph: { nodes: society.nodes, links: society.links },
    }
  }

  const { narrative, jsonText } = splitter.finish()
  let rawJson = parseJsonLoose(jsonText)

  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    console.warn('Stream JSON parse failed, using mock')
    const mock = normalizeSimulation(mockSimulation(society, promptText), society)
    return {
      society_id,
      simulation: { ...mock, narrative: narrative || mock.narrative },
      graph: { nodes: society.nodes, links: society.links },
    }
  }

  const merged = { ...rawJson, narrative: narrative || rawJson.narrative }
  let simulation = normalizeSimulation(merged, society)
  if (!simulation.quotes.length) {
    console.warn('No quotes in stream response, using mock')
    simulation = normalizeSimulation(mockSimulation(society, promptText), society)
    simulation = { ...simulation, narrative: narrative || simulation.narrative }
  }

  return {
    society_id,
    simulation,
    graph: {
      nodes: society.nodes,
      links: society.links,
    },
  }
}
