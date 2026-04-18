import { synthesizePersonaFromLinkedIn } from './personaSynthesis.js'
import { assembleGraph } from './graphAssembly.js'
import { searchProfiles } from './profileSearch.js'

// In-memory storage for societies (for the hackathon)
const societies = new Map()

/**
 * Generate an audience by semantic search over cached profiles.
 */
export async function generateAudience({ description, persona_count = 30 }) {
  console.log('Searching cached profiles by semantic similarity...')
  const matchedProfiles = await searchProfiles(description, persona_count)
  console.log(`Found ${matchedProfiles.length} matching profiles, synthesizing personas...`)

  const results = await Promise.all(matchedProfiles.map(synthesizePersonaFromLinkedIn))
  const personas = results.filter(Boolean)

  console.log('Assembling social network graph...')
  const { nodes, links } = await assembleGraph(personas)

  const society = {
    society_id: `soc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'complete',
    nodes,
    links,
    metadata: {
      total_personas: personas.length,
    },
  }

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
