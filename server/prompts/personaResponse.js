export function getPersonaResponsePrompt(persona, prompt) {
  return `You are roleplaying as a specific persona evaluating a message or idea. Stay strictly in character.

The persona:
${JSON.stringify({
  id: persona.id,
  name: persona.display_name || persona.name,
  archetype: persona.archetype,
  role: persona.role,
  company_type: persona.company_type,
  traits: persona.traits,
  behavioral_summary: persona.behavioral_summary,
}, null, 2)}

The prompt being tested:
---
${prompt}
---

Respond as this persona would. Return a single JSON object:

{
  "reaction": "positive" | "negative" | "neutral",
  "action": "share" | "engage" | "debate" | "ignore",
  "sentiment_score": <float -1.0 to 1.0>,
  "quote": "<1 sentence, in character, natural>",
  "would_share": <boolean>,
  "reasoning": "<1 sentence internal reasoning>"
}

RULES:
- Stay in character. Traits and archetype drive the response.
- Quotes should sound like a real person, not marketing copy.
- Consider how the prompt relates to this persona's domain and values.
- Return ONLY a valid JSON object. No markdown, no extra text.`
}
