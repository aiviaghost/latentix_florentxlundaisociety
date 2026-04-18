import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'

function linkEndpointId(nodeOrId) {
  if (nodeOrId && typeof nodeOrId === 'object' && 'id' in nodeOrId) return nodeOrId.id
  return nodeOrId
}

function linkTouchesIdSet(link, idSet) {
  if (!idSet?.size) return false
  const a = String(linkEndpointId(link.source))
  const b = String(linkEndpointId(link.target))
  return idSet.has(a) || idSet.has(b)
}

/** Map sentiment score -1..1 to hex color string (red → green). */
function scoreToCssColor(score) {
  if (score == null || !Number.isFinite(score)) return null
  const t = (score + 1) / 2
  const r = Math.round(239 * (1 - t) + 16 * t)
  const g = Math.round(68 * (1 - t) + 185 * t)
  const b = Math.round(68 * (1 - t) + 129 * t)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgb(hex) {
  const h = String(hex).replace('#', '')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if (![r, g, b].every((x) => Number.isFinite(x))) return null
  return { r, g, b }
}

function SocietyGraph({ graphData, simulationState, onNodeClick }) {
  const graphRef = useRef()
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 480 })

  const highlightIdSet = useMemo(() => {
    const s = simulationState
    if (!s) return null
    const set = new Set()
    if (s.focusNodeId != null && s.focusNodeId !== '') set.add(String(s.focusNodeId))
    for (const id of s.pendingPersonaIds || []) {
      if (id != null && id !== '') set.add(String(id))
    }
    return set.size ? set : null
  }, [simulationState])

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

  const nodeColor = useCallback(
    (node) => {
      const id = String(node.id)
      const score = simulationState?.sentimentByPersonaId?.[id]
      let hex = null
      if (score != null && Number.isFinite(score)) {
        hex = scoreToCssColor(score)
      }
      if (!hex && typeof node.color === 'string' && node.color.startsWith('#')) hex = node.color
      if (!hex) hex = '#8b5cf6'

      const streaming = simulationState?.streaming
      const map = simulationState?.sentimentByPersonaId || {}
      const reacted = Object.keys(map).length > 0
      const has = map[id] != null && Number.isFinite(map[id])
      // three-forcegraph only supports a numeric graph-level `nodeOpacity`; per-node opacity
      // must come from alpha in the color string (material opacity = nodeOpacity * colorAlpha).
      if (streaming && reacted && !has) {
        const rgb = hexToRgb(hex) || { r: 139, g: 92, b: 246 }
        return `rgba(${rgb.r},${rgb.g},${rgb.b},0.78)`
      }
      return hex
    },
    [simulationState]
  )

  const nodeVal = useCallback(
    (node) => {
      const id = String(node.id)
      const base = Math.max(Number(node.val) || 0, 4)
      const focus = simulationState?.focusNodeId != null ? String(simulationState.focusNodeId) : ''
      const pending = simulationState?.pendingPersonaIds || []
      const isFocus = focus !== '' && focus === id
      const isPending = pending.some((p) => String(p) === id)
      if (isFocus) return base * 1.45
      if (isPending) return base * 1.28
      return base
    },
    [simulationState]
  )

  const focusKey = simulationState?.focusNodeId != null ? String(simulationState.focusNodeId) : ''

  useEffect(() => {
    const fg = graphRef.current
    if (!fg || typeof fg.cameraPosition !== 'function') return
    const id = simulationState?.focusNodeId
    if (id == null || id === '') return
    const idStr = String(id)

    const t = window.setTimeout(() => {
      try {
        const graph = typeof fg.graphData === 'function' ? fg.graphData() : null
        const node = graph?.nodes?.find((n) => String(n.id) === idStr)
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
  }, [focusKey, simulationState?.focusNodeId])

  const sentimentSig = useMemo(() => {
    const m = simulationState?.sentimentByPersonaId || {}
    return Object.keys(m)
      .sort()
      .map((k) => `${k}:${m[k]}`)
      .join('|')
  }, [simulationState?.sentimentByPersonaId])

  const pendingSig = (simulationState?.pendingPersonaIds || []).map(String).join(',')

  useEffect(() => {
    graphRef.current?.refresh?.()
  }, [sentimentSig, pendingSig, focusKey, simulationState?.streaming])

  const streaming = simulationState?.streaming

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.max(64, Math.floor(rect.width))
      const h = Math.max(64, Math.floor(rect.height))
      setDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }))
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full min-h-0 min-w-0">
      <ForceGraph3D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        enablePointerInteraction
        nodeRelSize={6}
        nodeResolution={20}
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        nodeOpacity={1}
        nodeLabel={(node) => `${node.archetype || 'Persona'}: ${node.name || node.id}`}

        linkDirectionalParticles={(link) =>
          streaming && highlightIdSet && linkTouchesIdSet(link, highlightIdSet) ? 9 : 0
        }
        linkDirectionalParticleSpeed={(link) =>
          streaming && highlightIdSet && linkTouchesIdSet(link, highlightIdSet) ? 0.018 : 0.004
        }
        linkDirectionalParticleWidth={(link) =>
          streaming && highlightIdSet && linkTouchesIdSet(link, highlightIdSet) ? 2.2 : 0.35
        }
        linkDirectionalParticleColor={() => (streaming ? '#93c5fd' : '#60a5fa')}

        linkColor={(link) => {
          return streaming && highlightIdSet && linkTouchesIdSet(link, highlightIdSet)
            ? '#7dd3fc'
            : 'rgba(148,163,184,0.42)'
        }}
        linkWidth={(link) => {
          return streaming && highlightIdSet && linkTouchesIdSet(link, highlightIdSet) ? 3 : 0.85
        }}

        backgroundColor="#050510"

        onNodeClick={onNodeClick}

        d3AlphaDecay={0.022}
        d3VelocityDecay={0.32}
        warmupTicks={120}
        cooldownTicks={0}
      />
    </div>
  )
}

export default SocietyGraph
