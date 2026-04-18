/**
 * Single-shot society reaction summary for POST /api/simulate (hackathon shape).
 * Model must return one JSON object only (no markdown).
 */
export function getSimulationSummaryPrompt(ideaPrompt, compact) {
  return `You are summarizing how a synthetic persona network might respond to an idea or pitch.

Idea being tested:
---
${ideaPrompt}
---

Network (truncated for context):
- Personas (${compact.nodes.length} shown, ${compact.linkCount} total links in graph):
${JSON.stringify(compact.nodes, null, 2)}
- Sample edges (source → target): ${JSON.stringify(compact.sampleLinks, null, 2)}

Return exactly one JSON object with this shape (no other text):
{
  "headline": "One punchy line (max 120 chars)",
  "narrative": "2-4 sentences: overall society tone, themes, disagreements, who pushes back vs champions.",
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
    "adoption_rate": <0-1 float, rough share who would engage positively>,
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
