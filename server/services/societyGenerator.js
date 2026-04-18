import { synthesizePersonaFromLinkedIn } from './personaSynthesis.js'
import { assembleGraph } from './graphAssembly.js'
import { searchProfiles } from './profileSearch.js'

// In-memory storage for societies (for the hackathon)
const societies = new Map()

/**
 * Generate an audience by semantic search over cached profiles.
 * Emits streaming events via onEvent(type, data) as work progresses.
 */
export async function generateAudience({ description, persona_count = 30, onEvent }) {
  console.log('Searching cached profiles by semantic similarity...')
  const matchedProfiles = await searchProfiles(description, persona_count)
  console.log(`Found ${matchedProfiles.length} matching profiles, synthesizing personas...`)

  // Emit all matched profiles immediately
  matchedProfiles.forEach((profile, i) => {
    const currentRole = profile.Experiences?.[0]?.Role || profile.Workplace || ''
    const currentCompany = (profile.Experiences?.[0]?.Workplace || '').split('·')[0].trim()
    onEvent?.('profile_found', {
      profile: {
        id: `prof_${i}`,
        name: profile['Full Name'] || 'Unknown',
        title: currentRole,
        company: currentCompany,
        status: 'found',
        origin: 'index',
      },
    })
  })

  // Synthesize all in parallel; emit synthesizing + complete events per persona
  const personaPromises = matchedProfiles.map(async (profile, i) => {
    const profileId = `prof_${i}`
    const firstName = (profile['Full Name'] || '').split(' ')[0] || 'Person'

    onEvent?.('persona_synthesizing', {
      profileId,
      persona: {
        id: profileId,
        name: `${firstName} \u2026`,
        sourceProfileId: profileId,
        status: 'synthesizing',
        pipelineStage: 'index',
      },
    })

    const persona = await synthesizePersonaFromLinkedIn(profile)
    if (persona) {
      onEvent?.('persona_complete', {
        persona: { ...persona, sourceProfileId: profileId, status: 'ready', pipelineStage: 'index' },
      })
    }
    return persona
  })

  const personas = (await Promise.all(personaPromises)).filter(Boolean)

  console.log('Assembling social network graph...')
  onEvent?.('graph_progress', {
    message: 'Assembling social network graph\u2026',
    connectionsBuilt: 0,
    totalConnections: personas.length * 2,
  })

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

  onEvent?.('graph_complete', { nodes, links, clusters: [] })
  onEvent?.('society_ready', { society_id: society.society_id })

  console.log(`✅ Society generated: ${society.society_id} (${personas.length} personas)`)

  return society
}

/**
 * Get a society by ID
 */
export function getSociety(society_id) {
  return societies.get(society_id)
}
