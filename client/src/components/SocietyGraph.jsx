import { useRef, useCallback, useEffect } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'

// MOCK DATA - Person A can replace with real data
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

  // Use mock data if no real data provided
  const data = graphData || MOCK_GRAPH

  // Custom node rendering with THREE.js
  const nodeThreeObject = useCallback((node) => {
    const geometry = new THREE.SphereGeometry(node.val || 5, 16, 16)

    const isActive = simulationState?.activeNodes?.includes(node.id)
    const color = node.color || '#8b5cf6'

    const material = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: isActive ? 1.0 : 0.6,
      emissive: isActive ? color : 0x000000,
      emissiveIntensity: isActive ? 0.5 : 0,
    })

    const mesh = new THREE.Mesh(geometry, material)

    // TODO: Add text sprite for name (Person A can implement)

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
      nodeLabel={(node) => `${node.archetype}: ${node.name}`}

      // Particles for information flow
      linkDirectionalParticles={(link) => {
        const isActive = simulationState?.activeLinks?.includes(`${link.source.id}-${link.target.id}`)
        return isActive ? 4 : 0
      }}
      linkDirectionalParticleSpeed={0.005}
      linkDirectionalParticleColor={() => '#60a5fa'}

      // Link styling
      linkColor={(link) => {
        const isActive = simulationState?.activeLinks?.includes(`${link.source.id}-${link.target.id}`)
        return isActive ? '#60a5fa' : 'rgba(255,255,255,0.05)'
      }}
      linkWidth={(link) => {
        const isActive = simulationState?.activeLinks?.includes(`${link.source.id}-${link.target.id}`)
        return isActive ? 2 : 0.5
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
