import { callClaudeSonnet } from '../utils/anthropic.js'
import { getSociety } from './societyGenerator.js'
import { getSimulationSummaryPrompt } from '../prompts/simulationSummary.js'

function resolveSociety(society_id, society_snapshot) {
  const fromStore = getSociety(society_id)
  if (fromStore) return fromStore

  if (
    society_snapshot &&
    Array.isArray(society_snapshot.nodes) &&
    society_snapshot.nodes.length > 0 &&
    Array.isArray(society_snapshot.links)
  ) {
    return {
      society_id,
      nodes: society_snapshot.nodes,
      links: society_snapshot.links,
      metadata: { source: 'client_snapshot' },
    }
  }

  return null
}

function compactSocietyForPrompt(society) {
  const nodes = (society.nodes || []).slice(0, 24).map((p) => ({
    id: p.id,
    name: p.display_name || p.name,
    archetype: p.archetype,
    role: p.role,
    traits: p.traits,
  }))
  const links = society.links || []
  const sampleLinks = links.slice(0, 14).map((l) => ({
    source: typeof l.source === 'object' ? l.source.id : l.source,
    target: typeof l.target === 'object' ? l.target.id : l.target,
  }))
  return {
    nodes,
    linkCount: links.length,
    sampleLinks,
  }
}

function mockSimulation(society, promptText) {
  const list = society.nodes || []
  const n = list.length
  const clip = (s, max) => (s || '').slice(0, max) + ((s || '').length > max ? '…' : '')
  const quotes = list.slice(0, Math.min(5, Math.max(2, n || 2))).map((p, i) => ({
    persona_id: p.id,
    name: p.display_name || p.name || 'Persona',
    archetype: p.archetype || 'Member',
    quote:
      i % 2 === 0
        ? `I'd want more detail on "${clip(promptText, 36)}" before we move forward.`
        : 'Could work for our segment — I would run it past stakeholders.',
    sentiment: ['positive', 'neutral', 'negative'][i % 3],
  }))

  const pos = Math.max(1, Math.floor(n * 0.38) || 1)
  const neg = Math.max(0, Math.floor(n * 0.22))
  const neu = Math.max(0, n - pos - neg)

  return {
    headline: 'Demo signal: mixed reception across the synthetic network',
    narrative: `Across ${n || 'several'} personas, the pitch "${clip(
      promptText,
      90
    )}" draws practical questions more than hype. Operators ask for proof; champions like the direction but want a tighter wedge.`,
    quotes,
    metrics: {
      adoption_rate: n ? Math.min(0.82, 0.28 + n * 0.04) : 0.35,
      positive_count: pos,
      negative_count: neg,
      neutral_count: neu,
    },
  }
}

function normalizeSimulation(raw, society) {
  const nodes = society.nodes || []
  const validIds = new Set(nodes.map((p) => p.id).filter(Boolean))

  const headline =
    typeof raw?.headline === 'string' && raw.headline.trim()
      ? raw.headline.trim().slice(0, 200)
      : 'Simulation summary'

  const narrative =
    typeof raw?.narrative === 'string' && raw.narrative.trim()
      ? raw.narrative.trim()
      : 'The network shows a spread of reactions typical for this audience mix.'

  const quotesIn = Array.isArray(raw?.quotes) ? raw.quotes : []
  const quotes = quotesIn
    .map((q) => ({
      persona_id: validIds.has(q?.persona_id) ? q.persona_id : undefined,
      name: typeof q?.name === 'string' && q.name.trim() ? q.name.trim() : 'Persona',
      archetype: typeof q?.archetype === 'string' ? q.archetype : '',
      quote: typeof q?.quote === 'string' && q.quote.trim() ? q.quote.trim() : '—',
      sentiment: ['positive', 'negative', 'neutral'].includes(q?.sentiment) ? q.sentiment : 'neutral',
    }))
    .slice(0, 10)

  const m = raw?.metrics && typeof raw.metrics === 'object' ? raw.metrics : {}
  const positive_count = Number.isFinite(m.positive_count) ? Math.max(0, Math.floor(m.positive_count)) : 0
  const negative_count = Number.isFinite(m.negative_count) ? Math.max(0, Math.floor(m.negative_count)) : 0
  const neutral_count = Number.isFinite(m.neutral_count) ? Math.max(0, Math.floor(m.neutral_count)) : 0
  let adoption_rate =
    typeof m.adoption_rate === 'number' && Number.isFinite(m.adoption_rate)
      ? Math.min(1, Math.max(0, m.adoption_rate))
      : null
  if (adoption_rate == null && nodes.length > 0) {
    adoption_rate = Math.min(1, (positive_count + neutral_count * 0.5) / nodes.length)
  }
  if (adoption_rate == null) adoption_rate = 0.4

  return {
    headline,
    narrative,
    quotes,
    metrics: {
      adoption_rate,
      positive_count,
      negative_count,
      neutral_count,
    },
  }
}

/**
 * Run a simulation: one LLM summary (+ quotes). Playback is client-side only.
 */
export async function runSimulation(config) {
  const { society_id, content, idea_prompt, society_snapshot } = config

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
  let simulation

  try {
    const prompt = getSimulationSummaryPrompt(promptText, compact)
    const raw = await callClaudeSonnet(prompt)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Expected JSON object from model')
    }
    simulation = normalizeSimulation(raw, society)
    if (!simulation.quotes.length) {
      throw new Error('No quotes in model response')
    }
  } catch (err) {
    console.warn('Simulation LLM or parse failed, using mock:', err?.message || err)
    simulation = normalizeSimulation(mockSimulation(society, promptText), society)
  }

  console.log(`✅ Simulation summary ready for ${society_id} (${simulation.quotes.length} quotes)`)

  return {
    society_id,
    simulation,
    graph: {
      nodes: society.nodes,
      links: society.links,
    },
  }
}
