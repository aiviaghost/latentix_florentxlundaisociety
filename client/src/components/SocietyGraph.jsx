import { useRef, useCallback, useEffect, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'

function linkEndpointId(nodeOrId) {
  if (nodeOrId && typeof nodeOrId === 'object' && 'id' in nodeOrId) return nodeOrId.id
  return nodeOrId
}

function linkKey(link) {
  const s = linkEndpointId(link.source)
  const t = linkEndpointId(link.target)
  return `${s}-${t}`
}

// MOCK DATA when graphData is null
const MOCK_GRAPH = {
  nodes: [
    { id: 'p_1', name: 'Maria C.', archetype: 'Product Leader', val: 8, color: '#8b5cf6' },
    { id: 'p_2', name: 'John D.', archetype: 'Tech Founder', val: 10, color: '#3b82f6' },
    { id: 'p_3', name: 'Sarah K.', archetype: 'Investor', val: 12, color: '#ec4899' },
    { id: 'p_4', name: 'Alex P.', archetype: 'Developer', val: 6, color: '#10b981' },
    { id: 'p_5', name: 'Emma L.', archetype: 'Designer', val: 7, color: '#f59e0b' },
  ],
  links: [
    { source: 'p_1', target: 'p_2', strength: 0.6 },
    { source: 'p_2', target: 'p_3', strength: 0.8 },
    { source: 'p_1', target: 'p_4', strength: 0.5 },
    { source: 'p_3', target: 'p_5', strength: 0.7 },
    { source: 'p_4', target: 'p_5', strength: 0.4 },
  ]
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

  const nodeThreeObject = useCallback((node) => {
    const geometry = new THREE.SphereGeometry(node.val || 5, 16, 16)

    const isActive = simulationState?.activeNodes?.includes(node.id)
    const color = node.color || '#8b5cf6'

    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: isActive ? 1.0 : 0.65,
      emissive: isActive ? color : 0x000000,
      emissiveIntensity: isActive ? 0.45 : 0,
    })

    const mesh = new THREE.Mesh(geometry, material)
    return mesh
  }, [simulationState])

  // Auto-rotate when idle
  useEffect(() => {
    if (graphRef.current && !simulationState?.isRunning) {
      const graph = graphRef.current
      // Gentle auto-rotation
      // TODO: Implement camera animation (Person A)
    }
  }, [simulationState])

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={data}
      nodeThreeObject={nodeThreeObject}
      nodeLabel={(node) => `${node.archetype || 'Persona'}: ${node.name || node.id}`}

      linkDirectionalParticles={(link) => {
        const isActive = simulationState?.activeLinks?.includes(linkKey(link))
        return isActive ? 4 : 0
      }}
      linkDirectionalParticleSpeed={0.005}
      linkDirectionalParticleColor={() => '#60a5fa'}

      linkColor={(link) => {
        const isActive = simulationState?.activeLinks?.includes(linkKey(link))
        return isActive ? '#60a5fa' : 'rgba(148,163,184,0.22)'
      }}
      linkWidth={(link) => {
        const isActive = simulationState?.activeLinks?.includes(linkKey(link))
        return isActive ? 2 : 0.45
      }}

      // Background
      backgroundColor="#050510"

      // Interaction
      onNodeClick={onNodeClick}

      // Force configuration
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      warmupTicks={100}
      cooldownTicks={0}
    />
  )
}

export default SocietyGraph
