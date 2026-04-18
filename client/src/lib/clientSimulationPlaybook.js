/**
 * Client-only "playback" frames for 3D graph highlights (no server playbook).
 * Generalizes to any graph: BFS wave from seeds; random-walk fallback if sparse.
 */

const MAX_FRAMES = 24

function endpointId(nodeOrId) {
  if (nodeOrId && typeof nodeOrId === 'object' && 'id' in nodeOrId) return nodeOrId.id
  return nodeOrId
}

function linkKey(a, b) {
  return `${a}-${b}`
}

function buildAdjacency(nodes, links) {
  const ids = new Set((nodes || []).map((n) => n.id).filter(Boolean))
  const adj = new Map()
  for (const id of ids) adj.set(id, [])
  for (const l of links || []) {
    const a = endpointId(l.source)
    const b = endpointId(l.target)
    if (!ids.has(a) || !ids.has(b)) continue
    adj.get(a).push(b)
    adj.get(b).push(a)
  }
  return adj
}

function degree(id, adj) {
  return (adj.get(id) || []).length
}

function pickSeeds(nodes, links, quotes) {
  const ids = (nodes || []).map((n) => n.id).filter(Boolean)
  if (!ids.length) return []

  const hinted = []
  for (const q of quotes || []) {
    const pid = q.persona_id || q.id
    if (pid && ids.includes(pid)) hinted.push(pid)
  }
  const uniqHinted = [...new Set(hinted)]
  if (uniqHinted.length >= 2) return uniqHinted.slice(0, 3)

  const adj = buildAdjacency(nodes, links)
  const scored = ids.map((id) => ({
    id,
    score: degree(id, adj) * 10 + (Number(nodes.find((n) => n.id === id)?.val) || 5),
  }))
  scored.sort((a, b) => b.score - a.score)

  const seeds = [...new Set([...uniqHinted, ...scored.map((s) => s.id)])]
  return seeds.slice(0, Math.min(3, seeds.length))
}

function bfsEdges(nodes, links, seeds) {
  const adj = buildAdjacency(nodes, links)
  const visited = new Set(seeds)
  const q = [...seeds]
  const edges = []

  while (q.length && edges.length < 48) {
    const u = q.shift()
    const nbrs = adj.get(u) || []
    for (const v of nbrs) {
      if (visited.has(v)) continue
      visited.add(v)
      q.push(v)
      edges.push([u, v])
    }
  }
  return edges
}

function chunkFrames(edges, nodes) {
  if (!edges.length) {
    const ids = (nodes || []).map((n) => n.id).filter(Boolean)
    const frames = []
    for (let i = 0; i < ids.length && frames.length < MAX_FRAMES; i++) {
      frames.push({
        activeNodeIds: [ids[i]],
        activeLinkKeys: [],
        caption: 'Highlight',
      })
    }
    return frames
  }

  const frames = []
  let i = 0
  while (i < edges.length && frames.length < MAX_FRAMES) {
    const batch = edges.slice(i, i + 2)
    i += batch.length
    const activeNodeIds = [...new Set(batch.flat())]
    const activeLinkKeys = batch.map(([a, b]) => linkKey(a, b))
    frames.push({
      activeNodeIds,
      activeLinkKeys,
      caption: 'Signal spread',
    })
  }
  return frames
}

/**
 * @param {{ nodes: Array, links: Array }} graph
 * @param {{ quotes?: Array<{ persona_id?: string, name?: string }> }} [hints]
 * @returns {Array<{ activeNodeIds: string[], activeLinkKeys: string[], caption?: string }>}
 */
export function buildClientSimulationPlaybook(graph, hints = {}) {
  const nodes = graph?.nodes || []
  const links = graph?.links || []
  if (!nodes.length) return []

  const seeds = pickSeeds(nodes, links, hints.quotes)
  if (!seeds.length) {
    return chunkFrames([], nodes)
  }

  const edges = bfsEdges(nodes, links, seeds)
  if (!edges.length) {
    return chunkFrames([], nodes)
  }

  return chunkFrames(edges, nodes)
}
