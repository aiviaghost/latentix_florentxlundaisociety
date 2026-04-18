import pLimit from 'p-limit'
import { respondAsPersona } from './personaResponder.js'

/** Upper bound per request to avoid runaway latency; full society runs up to this size. */
const ABSOLUTE_MAX_PERSONAS = 80
const DEFAULT_CONCURRENCY = 4

function buildPersonaPrompt(ideaPrompt, conversation) {
  const trimmed = (ideaPrompt || '').trim()
  if (!conversation?.length) return trimmed
  const lines = conversation
    .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
    .join('\n')
  return `Conversation so far:\n${lines}\n\nLatest user message to react to:\n${trimmed}`
}

function reactionToSentiment(reaction) {
  if (reaction === 'positive') return 'positive'
  if (reaction === 'negative') return 'negative'
  return 'neutral'
}

function clip(s, max) {
  return (s || '').slice(0, max) + ((s || '').length > max ? '…' : '')
}

/**
 * One readable paragraph that ties individual quotes/reactions together (no extra LLM).
 */
function buildConsolidatedBrief(results, n, pos, neg, neu) {
  if (!n || !results.length) return ''
  const share = results.filter((r) => r.would_share).length
  const snippets = results
    .slice(0, 4)
    .map((r) => clip(r.quote, 100))
    .filter(Boolean)

  let tone = ''
  if (pos >= n * 0.55) tone = 'The network skews clearly positive on this pitch.'
  else if (neg >= n * 0.35) tone = 'Skepticism and pushback show up more often than enthusiasm.'
  else if (neu >= n * 0.45) tone = 'Most reactions are measured: interest mixed with caution.'
  else tone = 'Reactions are mixed across roles and incentives.'

  const shareLine =
    share > 0 ? ` About ${share} voice${share === 1 ? '' : 's'} signal they would amplify or share this externally.` : ''

  const quoteLine =
    snippets.length > 0
      ? ` Representative lines: ${snippets.slice(0, 2).map((q) => `“${q}”`).join(' · ')}`
      : ''

  return `${tone}${shareLine}${quoteLine}`
}

function buildSummaryFromResults(ideaPrompt, results, society, graphPersonaTotal) {
  const n = results.length
  const pos = results.filter((r) => r.reaction === 'positive').length
  const neg = results.filter((r) => r.reaction === 'negative').length
  const neu = Math.max(0, n - pos - neg)
  const meanScore =
    n > 0 ? results.reduce((s, r) => s + (Number.isFinite(r.sentiment_score) ? r.sentiment_score : 0), 0) / n : 0

  const clipIdea = (s, max) => (s || '').slice(0, max) + ((s || '').length > max ? '…' : '')
  const headline =
    meanScore > 0.15
      ? 'Overall the synthetic network leans receptive'
      : meanScore < -0.15
        ? 'Pushback outweighs enthusiasm in this slice'
        : 'Mixed signals across personas'

  const ranAll = graphPersonaTotal > 0 && n >= graphPersonaTotal
  const scopeLine = ranAll
    ? `All ${n} personas in this society were surveyed.`
    : graphPersonaTotal > 0
      ? `Surveyed ${n} of ${graphPersonaTotal} personas in this society.`
      : `Surveyed ${n} personas from the graph.`

  const narrative = `${scopeLine} Reactions to "${clipIdea(
    ideaPrompt,
    72
  )}" average ${meanScore.toFixed(2)} on sentiment. ${pos} lean positive, ${neg} negative, and ${neu} neutral or cautious.`

  const quotes = results.slice(0, 12).map((r) => ({
    persona_id: r.persona_id != null ? String(r.persona_id) : undefined,
    name: r.name,
    archetype: r.archetype || 'Member',
    quote: r.quote,
    sentiment: reactionToSentiment(r.reaction),
    sentiment_score: Number.isFinite(r.sentiment_score) ? r.sentiment_score : 0,
    confidence: r.confidence ?? null,
  }))

  const adoption_rate = n ? Math.min(1, Math.max(0, (pos + neu * 0.45) / n)) : 0.4

  const mean_sentiment =
    n > 0
      ? results.reduce((s, r) => s + (Number.isFinite(r.sentiment_score) ? r.sentiment_score : 0), 0) / n
      : 0

  const consolidated_brief = buildConsolidatedBrief(results, n, pos, neg, neu)

  return {
    headline,
    narrative,
    consolidated_brief,
    quotes,
    metrics: {
      adoption_rate,
      positive_count: pos,
      negative_count: neg,
      neutral_count: neu,
      mean_sentiment,
      personas_surveyed: n,
      personas_in_graph: graphPersonaTotal,
    },
    society_id: society.society_id,
    persona_count: n,
  }
}

/**
 * Run per-persona reactions with bounded concurrency; invoke callbacks for SSE.
 *
 * @param {{
 *   society: { society_id: string, nodes: Array, links?: Array },
 *   idea_prompt: string,
 *   conversation?: Array<{ role: string, content: string }>,
 *   signal?: AbortSignal,
 *   cap?: number | null,
 *   concurrency?: number,
 * }} params
 * `cap`: optional max personas to call (for testing). Omit or 0 to run **all** society nodes (up to ABSOLUTE_MAX_PERSONAS).
 */
export async function runPersonaBatchSimulation(params, hooks = {}) {
  const {
    society,
    idea_prompt,
    conversation = [],
    signal,
    cap = null,
    concurrency = DEFAULT_CONCURRENCY,
  } = params
  const { onPersonaStart, onPersonaComplete, onSummary } = hooks

  const allNodes = (society.nodes || []).filter((n) => n?.id)
  const graphPersonaTotal = allNodes.length

  let maxNodes = graphPersonaTotal
  if (cap != null && Number.isFinite(cap) && cap > 0) {
    maxNodes = Math.min(cap, graphPersonaTotal, ABSOLUTE_MAX_PERSONAS)
  } else {
    maxNodes = Math.min(graphPersonaTotal, ABSOLUTE_MAX_PERSONAS)
  }

  const nodes = allNodes.slice(0, maxNodes)
  const prompt = buildPersonaPrompt(idea_prompt, conversation)
  const limit = pLimit(concurrency)
  const results = []

  await Promise.all(
    nodes.map((node) =>
      limit(async () => {
        if (signal?.aborted) return
        onPersonaStart?.({ persona_id: String(node.id) })
        const raw = await respondAsPersona({ persona: node, prompt })
        if (signal?.aborted) return
        const row = {
          persona_id: String(node.id),
          name: node.display_name || node.name || 'Persona',
          archetype: node.archetype || '',
          quote: typeof raw?.quote === 'string' ? raw.quote : '—',
          reaction: ['positive', 'negative', 'neutral'].includes(raw?.reaction) ? raw.reaction : 'neutral',
          sentiment_score: Number.isFinite(raw?.sentiment_score) ? raw.sentiment_score : 0,
          reasoning: typeof raw?.reasoning === 'string' ? raw.reasoning : '',
          would_share: !!raw?.would_share,
          action: raw?.action || 'ignore',
        }
        results.push(row)
        onPersonaComplete?.(row)
      })
    )
  )

  if (signal?.aborted) return null

  const summary = buildSummaryFromResults(idea_prompt, results, society, graphPersonaTotal)
  onSummary?.(summary)
  return { results, summary }
}
