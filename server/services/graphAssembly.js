/**
 * Assemble a social network graph from personas
 */
export async function assembleGraph(personas) {
  const nodes = personas.map(p => ({
    id: p.id,
    name: p.display_name || p.name,
    val: (p.traits?.social_influence || 0.5) * 10 + 5, // Node size based on influence
    color: p.color || '#8b5cf6',
    archetype: p.archetype,
    ...p, // Include all persona data
  }))

  const links = []

  // Connection algorithm based on traits and roles
  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      const p1 = personas[i]
      const p2 = personas[j]

      // Calculate connection probability
      let connectionProb = 0

      // 1. Domain overlap
      const domains1 = p1.traits?.domain_expertise || []
      const domains2 = p2.traits?.domain_expertise || []
      const domainOverlap = domains1.filter(d => domains2.includes(d)).length
      connectionProb += domainOverlap > 0 ? 0.4 : 0

      // 2. Role similarity
      const tags1 = p1.connection_tags || []
      const tags2 = p2.connection_tags || []
      const tagOverlap = tags1.filter(t => tags2.includes(t)).length
      connectionProb += tagOverlap > 0 ? 0.3 : 0

      // 3. Random factor (small-world property)
      connectionProb += Math.random() * 0.3

      // Create link if probability exceeds threshold
      if (connectionProb > 0.5) {
        links.push({
          source: p1.id,
          target: p2.id,
          strength: connectionProb,
        })
      }
    }
  }

  // Ensure minimum connectivity (at least 2 connections per node on average)
  const minLinks = personas.length * 2
  while (links.length < minLinks && personas.length > 1) {
    const i = Math.floor(Math.random() * personas.length)
    const j = Math.floor(Math.random() * personas.length)

    if (i !== j) {
      const existing = links.find(
        l => (l.source === personas[i].id && l.target === personas[j].id) ||
             (l.source === personas[j].id && l.target === personas[i].id)
      )

      if (!existing) {
        links.push({
          source: personas[i].id,
          target: personas[j].id,
          strength: 0.3,
        })
      }
    }
  }

  // Add a few random long-range connections (small-world property)
  const longRangeCount = Math.floor(personas.length * 0.1)
  for (let k = 0; k < longRangeCount; k++) {
    const i = Math.floor(Math.random() * personas.length)
    const j = Math.floor(Math.random() * personas.length)

    if (i !== j) {
      const existing = links.find(
        l => (l.source === personas[i].id && l.target === personas[j].id) ||
             (l.source === personas[j].id && l.target === personas[i].id)
      )

      if (!existing) {
        links.push({
          source: personas[i].id,
          target: personas[j].id,
          strength: 0.2,
        })
      }
    }
  }

  console.log(`Assembled graph: ${nodes.length} nodes, ${links.length} links`)

  return { nodes, links }
}
