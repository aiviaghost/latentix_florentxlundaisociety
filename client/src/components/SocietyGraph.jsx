import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'

function linkEndpointId(nodeOrId) {
  if (nodeOrId && typeof nodeOrId === 'object' && 'id' in nodeOrId) return nodeOrId.id
  return nodeOrId
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

function popoverPositionStyle(x, y) {
  return {
    left: x,
    top: y,
    transform: 'translate(-50%, calc(-100% - 14px))',
  }
}

function SocietyGraph({ graphData, simulationState, focusedPersonaCallout, onNodeClick }) {
  const graphRef = useRef()
  const containerRef = useRef(null)
  const calloutRef = useRef(null)
  const focusIdRef = useRef('')
  const [dimensions, setDimensions] = useState({ width: 600, height: 480 })
  const [tipScreen, setTipScreen] = useState(null)
  const [hoverId, setHoverId] = useState(null)
  const [hoverScreen, setHoverScreen] = useState(null)

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
    calloutRef.current = focusedPersonaCallout
  }, [focusedPersonaCallout])

  useEffect(() => {
    focusIdRef.current = focusKey
  }, [focusKey])

  const syncScreenPopovers = useCallback(() => {
    const fg = graphRef.current
    if (!fg || typeof fg.graph2ScreenCoords !== 'function') {
      setTipScreen(null)
      setHoverScreen(null)
      return
    }

    const fc = calloutRef.current
    const fid = focusIdRef.current
    if (fc && fid) {
      const graph = typeof fg.graphData === 'function' ? fg.graphData() : null
      const node = graph?.nodes?.find((n) => String(n.id) === fid)
      if (node && node.x !== undefined && Number.isFinite(node.x)) {
        try {
          const s = fg.graph2ScreenCoords(node.x, node.y, node.z)
          if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) {
            setTipScreen({ x: s.x, y: s.y })
          }
        } catch {
          setTipScreen(null)
        }
      } else {
        setTipScreen(null)
      }
    } else {
      setTipScreen(null)
    }

    const hid = hoverId
    if (hid && !fc) {
      const graph = typeof fg.graphData === 'function' ? fg.graphData() : null
      const node = graph?.nodes?.find((n) => String(n.id) === hid)
      if (node && node.x !== undefined && Number.isFinite(node.x)) {
        try {
          const s = fg.graph2ScreenCoords(node.x, node.y, node.z)
          if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) {
            setHoverScreen({
              x: s.x,
              y: s.y,
              name: node.name || node.id,
              archetype: node.archetype,
            })
          }
        } catch {
          setHoverScreen(null)
        }
      } else {
        setHoverScreen(null)
      }
    } else {
      setHoverScreen(null)
    }
  }, [hoverId, focusedPersonaCallout])

  useEffect(() => {
    const active = focusedPersonaCallout || hoverId
    if (!active) {
      setTipScreen(null)
      setHoverScreen(null)
      return
    }
    let raf = 0
    const loop = () => {
      syncScreenPopovers()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [focusedPersonaCallout, hoverId, syncScreenPopovers])

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

  const nodeCount = data.nodes.length

  useEffect(() => {
    if (nodeCount === 0) return
    const fg = graphRef.current
    if (!fg || typeof fg.zoomToFit !== 'function') return
    const padding = Math.min(160, 36 + nodeCount * 2)
    const t = window.setTimeout(() => {
      try {
        fg.zoomToFit(700, padding)
      } catch {
        /* optional */
      }
    }, 180)
    return () => window.clearTimeout(t)
  }, [nodeCount, dimensions.width, dimensions.height])

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

  const onNodeHover = useCallback((node) => {
    setHoverId(node != null && node.id != null && node.id !== '' ? String(node.id) : null)
  }, [])

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-0 min-w-0">
      {hoverScreen && !focusedPersonaCallout && (
        <div
          className={cn(
            'pointer-events-none absolute z-40 max-h-[min(40vh,300px)] w-[min(20rem,calc(100%-1.5rem))] overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 px-4 py-3 text-popover-foreground shadow-2xl ring-1 ring-border/40 backdrop-blur-md'
          )}
          style={popoverPositionStyle(hoverScreen.x, hoverScreen.y)}
          role="dialog"
          aria-label="Persona preview"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Persona</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{hoverScreen.name}</p>
          {hoverScreen.archetype ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hoverScreen.archetype}</p>
          ) : null}
          <Separator className="my-2.5 bg-border/60" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Synthetic audience member. Scroll or drag to orbit. <span className="text-foreground/90">Tap once</span>{' '}
            (without dragging) during a run to pin their reaction and quote.
          </p>
        </div>
      )}

      {focusedPersonaCallout && tipScreen && (
        <div
          className={cn(
            'pointer-events-none absolute z-40 max-h-[min(42vh,320px)] w-[min(20rem,calc(100%-1.5rem))] overflow-y-auto rounded-2xl border border-primary/45 bg-popover/95 px-4 py-3 text-popover-foreground shadow-2xl ring-2 ring-primary/25 backdrop-blur-md'
          )}
          style={popoverPositionStyle(tipScreen.x, tipScreen.y)}
          role="dialog"
          aria-label="Focused persona reaction"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Focused persona</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{focusedPersonaCallout.name}</p>
          {focusedPersonaCallout.reaction ? (
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{focusedPersonaCallout.reaction}</p>
          ) : null}
          <Separator className="my-2.5 bg-border/60" />
          <p className="text-[13px] leading-relaxed text-foreground/95">
            &ldquo;{focusedPersonaCallout.quote}&rdquo;
          </p>
        </div>
      )}

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
        nodeLabel={() => ''}

        linkVisibility={() => false}
        linkDirectionalParticles={0}

        backgroundColor="#050510"

        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}

        d3AlphaDecay={0.022}
        d3VelocityDecay={0.32}
        warmupTicks={120}
        cooldownTicks={0}
      />
    </div>
  )
}

export default SocietyGraph
