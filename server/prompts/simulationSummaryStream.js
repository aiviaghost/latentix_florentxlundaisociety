/** Delimiter between streamed prose narrative and trailing JSON (single line, exact). */
export const SIMULATION_STREAM_JSON_DELIM = '---LATENTIX_JSON---'

const MAX_PRIOR_TURNS = 10
const MAX_ASSISTANT_CHARS = 800
const MAX_USER_CHARS = 2000

/**
 * Stream-friendly prompt: model emits plain narrative, delimiter line, then one JSON object.
 * JSON must include headline, quotes, metrics (same contract as non-stream path); omit narrative in JSON.
 */
export function getSimulationStreamPrompt(ideaPrompt, compact, priorTurns = []) {
  const trimmedPrior = (priorTurns || [])
    .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .slice(-MAX_PRIOR_TURNS)
    .map((t) => ({
      role: t.role,
      content:
        t.role === 'assistant'
          ? t.content.slice(0, MAX_ASSISTANT_CHARS)
          : t.content.slice(0, MAX_USER_CHARS),
    }))

  const priorBlock =
    trimmedPrior.length > 0
      ? `Prior conversation (most recent last; stay consistent with these reactions when updating):\n${JSON.stringify(
          trimmedPrior,
          null,
          2
        )}\n\n`
      : ''

  return `You are summarizing how a synthetic persona network might respond to an idea or pitch.

${priorBlock}Current message to evaluate (the user's latest idea, follow-up, or reframing):
---
${ideaPrompt}
---

Network (truncated for context):
- Personas (${compact.nodes.length} shown, ${compact.linkCount} total links in graph):
${JSON.stringify(compact.nodes, null, 2)}
- Sample edges (source → target): ${JSON.stringify(compact.sampleLinks, null, 2)}

Output format — you MUST follow this exactly:

1) First, write 2–4 sentences of plain prose only (no markdown headings, no code fences). This is the narrative the UI streams first.

2) Then on its own line, exactly this text:
${SIMULATION_STREAM_JSON_DELIM}

3) Immediately after that line, output a single JSON object (no markdown fences) with this shape. Do NOT include a "narrative" key in the JSON; the prose above is the narrative.
{
  "headline": "One punchy line (max 120 chars)",
  "quotes": [
    {
      "persona_id": "<must match an id from the persona list when possible>",
      "name": "<display name>",
      "archetype": "<short>",
      "quote": "<one sentence in voice of that persona>",
      "sentiment": "positive" | "negative" | "neutral"
    }
  ],
  "metrics": {
    "adoption_rate": <0-1 float>,
    "positive_count": <int>,
    "negative_count": <int>,
    "neutral_count": <int>
  }
}

Rules:
- Provide 4–8 quotes from different personas when the list is long; at least 2 quotes if few personas.
- Counts in metrics should be plausible non-negative integers that sum to at most the number of personas shown.
- persona_id must be omitted or set to a real id from the input list.`
}
