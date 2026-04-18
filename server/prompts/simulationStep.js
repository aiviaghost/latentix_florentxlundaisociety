/**
 * Prompt for simulating persona reactions to a startup idea
 */
export function getSimulationStepPrompt(personas, content, context) {
  return `You are simulating how a group of personas react to a startup idea. Each persona has a unique personality and their own way of evaluating ideas.

The idea being tested:
---
${content}
---

Context for this step:
${context}

Personas to evaluate:
${JSON.stringify(personas.map(p => ({
  id: p.id,
  name: p.display_name || p.name,
  archetype: p.archetype,
  role: p.role,
  company_type: p.company_type,
  traits: p.traits,
  behavioral_summary: p.behavioral_summary,
})), null, 2)}

For EACH persona, return their reaction based on who they are:

[
  {
    "agent_id": "<id>",
    "reaction": "positive" | "negative" | "neutral",
    "action": "share" | "engage" | "debate" | "ignore",
    "sentiment_score": <float -1.0 to 1.0>,
    "quote": "<1 sentence, in character, natural>",
    "would_share": <boolean>,
    "reasoning": "<1 sentence internal reasoning>"
  },
  ...
]

RULES:
- Stay in character. A "Skeptical Investor" IS skeptical.
- Vary reactions. Not everything should be positive.
- Quotes should sound like real people, not marketing copy.
- Consider how the idea relates to each persona's domain expertise.
- If someone is price-sensitive and the product is expensive, they should notice.
- If someone values innovation and this is innovative, they should appreciate it.
- If exposed via someone else's share, consider their influence and the context.
- Return ONLY a valid JSON array. No markdown, no extra text.

Example good quotes:
- "Love the concept but I'd need SOC 2 before I'd even start a trial."
- "This is exactly what's missing in the market right now."
- "The pricing feels steep for early-stage startups."
- "Not convinced the problem is painful enough to warrant a new tool."

Return ONLY valid JSON array. No markdown.`
}
