import { synthesizePersonaFromLinkedIn } from './personaSynthesis.js'
import { assembleGraph } from './graphAssembly.js'
import { searchProfiles } from './profileSearch.js'

// In-memory storage for societies (for the hackathon)
const societies = new Map()

function assertNotAborted(signal) {
  if (signal?.aborted) {
    const err = new Error('Aborted')
    err.name = 'AbortError'
    throw err
  }
}

/**
 * Generate an audience by semantic search over cached profiles.
 * Emits streaming events via onEvent(type, data) as work progresses.
 *
 * @param {{ description: string, persona_count?: number, onEvent?: (type: string, data: object) => void, signal?: AbortSignal }} params
 */
export async function generateAudience({ description, persona_count = 30, onEvent, signal }) {
  assertNotAborted(signal)
  console.log('Searching cached profiles by semantic similarity...')
  const matchedProfiles = await searchProfiles(description, persona_count)
  assertNotAborted(signal)
  console.log(`Found ${matchedProfiles.length} matching profiles, synthesizing personas...`)

  for (let i = 0; i < matchedProfiles.length; i++) {
    assertNotAborted(signal)
    const profile = matchedProfiles[i]
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
  }

  const personaPromises = matchedProfiles.map(async (profile, i) => {
    assertNotAborted(signal)
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
  assertNotAborted(signal)

  console.log('Assembling social network graph...')
  onEvent?.('graph_progress', {
    message: 'Assembling social network graph\u2026',
    connectionsBuilt: 0,
    totalConnections: personas.length * 2,
  })

  const { nodes, links } = await assembleGraph(personas)
  assertNotAborted(signal)

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
