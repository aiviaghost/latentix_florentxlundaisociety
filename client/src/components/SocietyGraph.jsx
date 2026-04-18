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

function SocietyGraph({ graphData, simulationState, onNodeClick }) {
  const graphRef = useRef()
  const data = useMemo(() => {
    if (!graphData?.nodes?.length) return { nodes: [], links: [] }
    const raw = graphData
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
