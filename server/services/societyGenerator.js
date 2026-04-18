import { callClaudeHaiku } from '../utils/anthropic.js'
import { synthesizePersonasFromDescription } from './personaSynthesis.js'
import { assembleGraph } from './graphAssembly.js'
import { fetchLinkedInProfiles } from './linkedinFetcher.js'

// In-memory storage for societies (for the hackathon)
const societies = new Map()

/**
 * Generate a society based on configuration
 */
export async function generateSociety(config) {
  const {
    mode,
    description,
    linkedin_urls,
    persona_count,
    supplement_count,
  } = config

  let personas = []

  if (mode === 'describe') {
    // Generate personas from description
    console.log('Synthesizing personas from description...')
    personas = await synthesizePersonasFromDescription(description, persona_count)
  } else if (mode === 'linkedin') {
    // Fetch LinkedIn profiles and synthesize
    console.log('Fetching LinkedIn profiles...')
    const linkedInProfiles = await fetchLinkedInProfiles(linkedin_urls)

    console.log(`Fetched ${linkedInProfiles.length} LinkedIn profiles`)

    // Synthesize personas from LinkedIn data
    // TODO: Person D to implement LinkedIn persona synthesis

    // For now, generate supplemental personas to fill the society
    const remainingCount = supplement_count || (persona_count - linkedInProfiles.length)
    if (remainingCount > 0) {
      console.log(`Generating ${remainingCount} supplemental personas...`)
      const supplemental = await synthesizePersonasFromDescription(
        `Professional network similar to the provided profiles`,
        remainingCount
      )
      personas = [...linkedInProfiles, ...supplemental]
    } else {
      personas = linkedInProfiles
    }
  }

  // Assemble the graph
  console.log('Assembling social network graph...')
  const { nodes, links } = await assembleGraph(personas)

  // Create society object
  const society = {
    society_id: `soc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nodes,
    links,
    metadata: {
      total_personas: personas.length,
      real_profiles: mode === 'linkedin' ? (linkedin_urls?.length || 0) : 0,
      generated_profiles: personas.length - (mode === 'linkedin' ? (linkedin_urls?.length || 0) : 0),
      clusters: ['tech-founders', 'product-leaders', 'investors'], // TODO: Extract from actual clustering
    },
  }

  // Store in memory
  societies.set(society.society_id, society)

  console.log(`✅ Society generated: ${society.society_id} (${personas.length} personas)`)

  return society
}

/**
 * Get a society by ID
 */
export function getSociety(society_id) {
  return societies.get(society_id)
}
