import { useRef, useCallback, useEffect, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'

function linkEndpointId(nodeOrId) {
  if (nodeOrId && typeof nodeOrId === 'object' && 'id' in nodeOrId) return nodeOrId.id
  return nodeOrId
}

function linkMatchesActive(link, activeLinks) {
  if (!activeLinks?.length) return false
  const a = linkEndpointId(link.source)
  const b = linkEndpointId(link.target)
  const k1 = `${a}-${b}`
  const k2 = `${b}-${a}`
  return activeLinks.includes(k1) || activeLinks.includes(k2)
}

/** Rich mock when graphData is null: hub + ring + cross-links for visible structure */
const MOCK_GRAPH = {
  nodes: [
    { id: 'hub', name: 'Jordan R.', archetype: 'Connector', val: 14, color: '#a78bfa' },
    { id: 'p_1', name: 'Maria C.', archetype: 'Product Leader', val: 8, color: '#8b5cf6' },
    { id: 'p_2', name: 'John D.', archetype: 'Tech Founder', val: 10, color: '#3b82f6' },
    { id: 'p_3', name: 'Sarah K.', archetype: 'Investor', val: 12, color: '#ec4899' },
    { id: 'p_4', name: 'Alex P.', archetype: 'Developer', val: 6, color: '#10b981' },
    { id: 'p_5', name: 'Emma L.', archetype: 'Designer', val: 7, color: '#f59e0b' },
  ],
  links: [
    { source: 'hub', target: 'p_1', type: 'collab', strength: 0.85 },
    { source: 'hub', target: 'p_2', type: 'collab', strength: 0.9 },
    { source: 'hub', target: 'p_3', type: 'collab', strength: 0.88 },
    { source: 'hub', target: 'p_4', type: 'advisor', strength: 0.55 },
    { source: 'hub', target: 'p_5', type: 'advisor', strength: 0.6 },
    { source: 'p_1', target: 'p_2', type: 'peer', strength: 0.5 },
    { source: 'p_2', target: 'p_3', type: 'peer', strength: 0.55 },
    { source: 'p_3', target: 'p_5', type: 'peer', strength: 0.5 },
    { source: 'p_4', target: 'p_5', type: 'peer', strength: 0.45 },
    { source: 'p_1', target: 'p_4', type: 'weak', strength: 0.35 },
  ],
}

function SocietyGraph({ graphData, simulationState, onNodeClick }) {
  const graphRef = useRef()
  const data = useMemo(() => {
    const raw = graphData?.nodes?.length ? graphData : MOCK_GRAPH
    const nodes = (raw.nodes || []).map((n) => ({
      ...n,
      name: n.name || n.display_name || n.id,
    }))
    const links = (raw.links || []).map((l) => ({
      ...l,
      source: linkEndpointId(l.source),
      target: linkEndpointId(l.target),
    }))
    return { nodes, links }
  }, [graphData])

  const nodeThreeObject = useCallback(
    (node) => {
      const baseR = Math.min(12, Math.max(3, (node.val || 5) * 0.42))
      const isActive = simulationState?.activeNodes?.includes(node.id)
      const r = isActive ? baseR * 1.38 : baseR
      const geometry = new THREE.SphereGeometry(r, 20, 20)

      const color = node.color || '#8b5cf6'

      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: isActive ? 1 : 0.62,
        emissive: isActive ? color : 0x000000,
        emissiveIntensity: isActive ? 0.75 : 0,
        shininess: isActive ? 95 : 55,
      })

      return new THREE.Mesh(geometry, material)
    },
    [simulationState]
  )

  const activeKey = (simulationState?.activeNodes || []).join(',')

  useEffect(() => {
    const fg = graphRef.current
    if (!fg || typeof fg.cameraPosition !== 'function') return
    if (!simulationState?.activeNodes?.length) return

    const t = window.setTimeout(() => {
      try {
        const id = simulationState.activeNodes[0]
        const graph = typeof fg.graphData === 'function' ? fg.graphData() : null
        const node = graph?.nodes?.find((n) => n.id === id)
        if (!node || node.x === undefined) return
        const d = 200
        fg.cameraPosition(
          { x: node.x + d * 0.55, y: node.y + d * 0.32, z: node.z + d * 0.5 },
          node,
          520
        )
      } catch {
        /* camera API optional */
      }
    }, 80)

    return () => window.clearTimeout(t)
  }, [activeKey, simulationState?.activeNodes])

  const playing = simulationState?.isRunning

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={data}
      nodeThreeObject={nodeThreeObject}
      nodeLabel={(node) => `${node.archetype || 'Persona'}: ${node.name || node.id}`}

      linkDirectionalParticles={(link) => (linkMatchesActive(link, simulationState?.activeLinks) ? 10 : 0)}
      linkDirectionalParticleSpeed={(link) =>
        linkMatchesActive(link, simulationState?.activeLinks) ? 0.018 : 0.004
      }
      linkDirectionalParticleWidth={(link) =>
        linkMatchesActive(link, simulationState?.activeLinks) ? 2.4 : 0.35
      }
      linkDirectionalParticleColor={() => (playing ? '#93c5fd' : '#60a5fa')}

      linkColor={(link) => {
        return linkMatchesActive(link, simulationState?.activeLinks)
          ? '#7dd3fc'
          : 'rgba(148,163,184,0.42)'
      }}
      linkWidth={(link) => {
        return linkMatchesActive(link, simulationState?.activeLinks) ? 3.2 : 0.85
      }}

      backgroundColor="#050510"

      onNodeClick={onNodeClick}

      d3AlphaDecay={0.022}
      d3VelocityDecay={0.32}
      warmupTicks={120}
      cooldownTicks={0}
    />
  )
}

export default SocietyGraph
