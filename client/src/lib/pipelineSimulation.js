/**
 * Drives the progressive pipeline animation using real nodes returned by generateAudience.
 * Events mirror the shapes that usePipelineUpdates expects.
 */

const DELAY_INDEX_BEAT = 420
const DELAY_PROFILE_FOUND = 260
const DELAY_SCRAPE = 120
const DELAY_LINK_START = 100
const DELAY_LINK_DONE = 200
const DELAY_GRAPH_TICK = 380

/**
 * @param {(msg: object) => void} onEvent
 * @param {{ query?: string, nodes?: Array, links?: Array }} options
 * @returns {() => void} cancel
 */
export function scheduleSimulatedPipeline(onEvent, options = {}) {
  const timers = []
  const { query = '', nodes = [], links = [] } = options
  const q = query.trim()

  const schedule = (delayMs, fn) => {
    timers.push(setTimeout(fn, delayMs))
  }

  let cursor = DELAY_INDEX_BEAT

  nodes.forEach((node) => {
    const displayName = node.name || node.display_name || 'Person'
    const firstName = displayName.split(' ')[0]
    const profileId = `prof_${node.id}`

    const profile = {
      id: profileId,
      name: displayName,
      title: node.role || node.archetype,
      company: node.company_type || '',
      status: 'found',
      origin: 'index',
    }

    schedule(cursor, () => onEvent({ type: 'profile_found', profile }))
    cursor += DELAY_PROFILE_FOUND

    schedule(cursor, () =>
      onEvent({ type: 'profile_scraped', profile: { ...profile, status: 'scraped' } })
    )
    cursor += DELAY_SCRAPE

    schedule(cursor, () =>
      onEvent({
        type: 'persona_synthesizing',
        profileId,
        persona: { id: node.id, name: `${firstName} …`, status: 'synthesizing', pipelineStage: 'index' },
      })
    )
    cursor += DELAY_LINK_START

    schedule(cursor, () =>
      onEvent({
        type: 'persona_complete',
        persona: { ...node, name: displayName, status: 'ready', pipelineStage: 'index' },
      })
    )
    cursor += DELAY_LINK_DONE
  })

  const potentialConn = (nodes.length * (nodes.length - 1)) / 2
  const totalConn = Math.max(12, Math.round(potentialConn * 0.72))
  const firstConn = Math.max(4, Math.round(totalConn * 0.25))
  const secondConn = Math.max(firstConn + 1, Math.round(totalConn * 0.65))

  schedule(cursor, () =>
    onEvent({
      type: 'graph_progress',
      message: 'Assembling graph from linked personas…',
      connectionsBuilt: firstConn,
      totalConnections: totalConn,
    })
  )
  cursor += DELAY_GRAPH_TICK

  schedule(cursor, () =>
    onEvent({
      type: 'graph_progress',
      message: 'Assembling graph from linked personas…',
      connectionsBuilt: secondConn,
      totalConnections: totalConn,
    })
  )
  cursor += DELAY_GRAPH_TICK

  schedule(cursor, () =>
    onEvent({
      type: 'graph_complete',
      clusters: [],
      nodes,
      links,
      queryHint: q.slice(0, 80),
    })
  )

  return () => {
    timers.forEach(clearTimeout)
  }
}
