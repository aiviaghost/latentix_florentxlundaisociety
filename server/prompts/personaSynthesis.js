/**
 * Prompt for generating a society from a description
 */
export function getSocietyGenerationPrompt(description, count) {
  return `You are building an AI society for a market simulation. Given a description of a target audience, generate ${count} diverse personas that form a realistic professional network.

Target audience description:
"${description}"

Generate exactly ${count} personas. Each persona must be DISTINCT — vary by:
- Seniority (junior to C-level)
- Risk tolerance (conservative to adventurous)
- Role type (technical, business, investor, creative)
- Domain expertise
- Personality (skeptic, enthusiast, pragmatist, etc.)

For each persona, return:
{
  "id": "p_{index}",
  "display_name": "First L.",
  "archetype": "<2-3 word archetype>",
  "role": "<job title>",
  "company_type": "<startup / enterprise / VC / agency / etc>",
  "color": "<hex color code>",
  "traits": {
    "risk_tolerance": <0-1>,
    "price_sensitivity": <0-1>,
    "innovation_openness": <0-1>,
    "social_influence": <0-1>,
    "tech_savviness": <0-1>,
    "domain_expertise": ["<domain1>", "<domain2>"]
  },
  "behavioral_summary": "<2 sentence personality + decision-making style>",
  "connection_tags": ["<tag1>", "<tag2>"]
}

Return a JSON object with this structure:
{
  "personas": [... array of ${count} personas ...],
  "connections": [
    { "from": "p_0", "to": "p_3", "reason": "same domain" },
    ...
  ]
}

The network should have:
- 2-3 hub nodes with 6+ connections (high social_influence)
- Natural clusters (e.g., "tech founders", "investors", "enterprise buyers")
- Cross-cluster bridges (people who connect different groups)
- Average 3-4 connections per node

Use diverse color codes for visual distinction. Return ONLY valid JSON. No markdown.`
}

/**
 * Prompt for synthesizing a persona from LinkedIn data
 */
export function getLinkedInPersonaSynthesisPrompt(profileData) {
  return `Given this public LinkedIn profile data, create a behavioral persona for a market simulation.

Profile data:
${JSON.stringify(profileData, null, 2)}

Return a JSON object matching this schema:
{
  "id": "p_linkedin_{hash}",
  "display_name": "<First name + last initial>",
  "archetype": "<2-3 word archetype based on their career>",
  "role": "<current title>",
  "company_type": "<inferred company stage/type>",
  "source": "linkedin",
  "color": "<hex color code>",
  "traits": {
    "risk_tolerance": <inferred 0-1>,
    "price_sensitivity": <inferred 0-1>,
    "innovation_openness": <inferred 0-1>,
    "social_influence": <inferred from connections count + seniority>,
    "tech_savviness": <inferred from skills + background>,
    "domain_expertise": [<top 3 inferred domains>]
  },
  "behavioral_summary": "<2 sentences capturing how this person evaluates new products/ideas based on their background>",
  "connection_tags": [<tags for graph assembly>]
}

Be specific. A "VP Product at Stripe" thinks very differently from a "Junior Developer at a startup." Use their actual background to create a realistic behavioral profile.

Return ONLY valid JSON. No markdown.`
}
