/**
 * Scripted pipeline events (same shapes as live WebSocket) for client-side demo.
 * Narrative: audience description → match stored index profiles → link pre-built personas → graph.
 */

const DELAY_INDEX_BEAT = 420
const DELAY_PROFILE_FOUND = 260
const DELAY_SCRAPE = 120
const DELAY_LINK_START = 100
const DELAY_LINK_DONE = 200
const DELAY_GRAPH_TICK = 380

const BASE_FIXTURES = [
  {
    profileId: 'prof_1',
    personaId: 'persona_1',
    profile: {
      name: 'Alex M.',
      title: 'Co-Founder & CEO @ Northstack',
      company: 'Northstack',
      location: 'Berlin, DE',
      skills: ['SaaS', 'Fintech', 'API platforms'],
    },
    persona: {
      name: 'Alex M.',
      archetype: 'Tech Founder',
      role: 'Co-Founder & CEO',
      company_type: 'startup',
      color: '#3b82f6',
      traits: {
        risk_tolerance: 0.85,
        innovation_openness: 0.9,
        social_influence: 0.75,
        domain_expertise: ['saas', 'fintech', 'api-platforms'],
      },
    },
  },
  {
    profileId: 'prof_2',
    personaId: 'persona_2',
    profile: {
      name: 'Sarah K.',
      title: 'VP Product @ Meridian',
      company: 'Meridian',
      location: 'London, UK',
      skills: ['Product strategy', 'B2B SaaS', 'Analytics'],
    },
    persona: {
      name: 'Sarah K.',
      archetype: 'Product Leader',
      role: 'VP Product',
      company_type: 'enterprise',
      color: '#8b5cf6',
      traits: {
        risk_tolerance: 0.6,
        innovation_openness: 0.75,
        social_influence: 0.7,
        domain_expertise: ['product-strategy', 'b2b-saas', 'analytics'],
      },
    },
  },
  {
    profileId: 'prof_3',
    personaId: 'persona_3',
    profile: {
      name: 'James L.',
      title: 'Partner @ Apex Ventures',
      company: 'Apex Ventures',
      location: 'San Francisco, CA',
      skills: ['Venture capital', 'GTM', 'Market research'],
    },
    persona: {
      name: 'James L.',
      archetype: 'Investor',
      role: 'Partner',
      company_type: 'vc',
      color: '#ec4899',
      traits: {
        risk_tolerance: 0.7,
        innovation_openness: 0.8,
        social_influence: 0.9,
        domain_expertise: ['venture-capital', 'market-research', 'go-to-market'],
      },
    },
  },
  {
    profileId: 'prof_4',
    personaId: 'persona_4',
    profile: {
      name: 'Maria P.',
      title: 'Senior Software Engineer @ Lattice',
      company: 'Lattice',
      location: 'Toronto, CA',
      skills: ['Backend', 'DevOps', 'APIs'],
    },
    persona: {
      name: 'Maria P.',
      archetype: 'Developer',
      role: 'Senior Software Engineer',
      company_type: 'startup',
      color: '#10b981',
      traits: {
        risk_tolerance: 0.55,
        innovation_openness: 0.8,
        social_influence: 0.4,
        domain_expertise: ['backend', 'devops', 'apis'],
      },
    },
  },
  {
    profileId: 'prof_5',
    personaId: 'persona_5',
    profile: {
      name: 'David R.',
      title: 'Director of IT @ Contoso',
      company: 'Contoso',
      location: 'Chicago, IL',
      skills: ['Enterprise IT', 'Security', 'Compliance'],
    },
    persona: {
      name: 'David R.',
      archetype: 'Enterprise Buyer',
      role: 'Director of IT',
      company_type: 'enterprise',
      color: '#6366f1',
      traits: {
        risk_tolerance: 0.3,
        innovation_openness: 0.45,
        social_influence: 0.5,
        domain_expertise: ['enterprise-it', 'security', 'compliance'],
      },
    },
  },
]

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildGraph(nodesPersonas) {
  const nodes = nodesPersonas.map((p) => ({
    id: p.id,
    name: p.name,
    val: (p.traits?.social_influence ?? 0.5) * 10 + 5,
    color: p.color,
    archetype: p.archetype,
    ...p,
  }))

  const links = []
  const ids = nodes.map((n) => n.id)
  const seed = hashStr(ids.join('|'))

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const v = ((seed + i * 17 + j * 31) % 1000) / 1000
      if (v > 0.28) {
        links.push({
          source: ids[i],
          target: ids[j],
          strength: 0.42 + v * 0.45,
        })
      }
    }
  }
  if (links.length < ids.length - 1) {
    for (let k = 0; k < ids.length - 1; k++) {
      links.push({ source: ids[k], target: ids[k + 1], strength: 0.55 })
    }
  }

  return { nodes, links }
}

/**
 * @param {(msg: object) => void} onEvent
 * @param {{ query?: string }} [options]
 * @returns {() => void} cancel
 */
export function scheduleSimulatedPipeline(onEvent, options = {}) {
  const timers = []
  const q = (options.query || '').trim()
  const schedule = (delayMs, fn) => {
    timers.push(setTimeout(fn, delayMs))
  }

  let cursor = DELAY_INDEX_BEAT
  const personasComplete = []

  BASE_FIXTURES.forEach((fx) => {
    const profileFound = {
      id: fx.profileId,
      ...fx.profile,
      status: 'found',
      origin: 'index',
    }
    const profileScraped = {
      id: fx.profileId,
      ...fx.profile,
      status: 'scraped',
      origin: 'index',
    }

    schedule(cursor, () =>
      onEvent({
        type: 'profile_found',
        profile: profileFound,
      })
    )
    cursor += DELAY_PROFILE_FOUND

    schedule(cursor, () =>
      onEvent({
        type: 'profile_scraped',
        profile: profileScraped,
      })
    )
    cursor += DELAY_SCRAPE

    schedule(cursor, () =>
      onEvent({
        type: 'persona_synthesizing',
        profileId: fx.profileId,
        persona: {
          id: fx.personaId,
          name: `${fx.persona.name.split(' ')[0]} …`,
          status: 'synthesizing',
          pipelineStage: 'index',
        },
      })
    )
    cursor += DELAY_LINK_START

    schedule(cursor, () => {
      const complete = {
        id: fx.personaId,
        ...fx.persona,
        status: 'ready',
        pipelineStage: 'index',
      }
      personasComplete.push(complete)
      onEvent({
        type: 'persona_complete',
        persona: complete,
      })
    })
    cursor += DELAY_LINK_DONE
  })

  const totalConn = 36
  schedule(cursor, () =>
    onEvent({
      type: 'graph_progress',
      message: 'Assembling graph from linked personas…',
      connectionsBuilt: 8,
      totalConnections: totalConn,
    })
  )
  cursor += DELAY_GRAPH_TICK

  schedule(cursor, () =>
    onEvent({
      type: 'graph_progress',
      message: 'Assembling graph from linked personas…',
      connectionsBuilt: 22,
      totalConnections: totalConn,
    })
  )
  cursor += DELAY_GRAPH_TICK

  schedule(cursor, () => {
    const { nodes, links } = buildGraph(personasComplete)
    onEvent({
      type: 'graph_complete',
      clusters: ['tech-founders', 'product-leaders', 'enterprise-buyers'],
      nodes,
      links,
      queryHint: q.slice(0, 80),
    })
  })

  return () => {
    timers.forEach(clearTimeout)
  }
}
