import { useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import SourceNode from './SourceNode'
import ProcessingNode from './ProcessingNode'
import OutputNode from './OutputNode'
import ProfileNode from './ProfileNode'
import PersonaNode from './PersonaNode'
import { PIPELINE } from '../../lib/pipelineCopy'

const nodeTypes = {
  source: SourceNode,
  processing: ProcessingNode,
  output: OutputNode,
  profile: ProfileNode,
  persona: PersonaNode,
}

/** Max profile rows from index before collapsing (layout + perf). */
const MAX_PIPELINE_ROWS = 12

/** Max persona cards shown in the pipeline; additional personas roll into an overflow chip. */
const MAX_PERSONA_PIPELINE_ROWS = 5

/** Layout: card column width (matches Tailwind w-72) + horizontal/vertical rhythm.
 * PersonaNode (traits + tags) is taller than profile cards; keep one shared row pitch
 * so profile ↔ persona rows stay aligned without vertical overlap. */
const CARD_WIDTH = 288
const COLUMN_GAP = 160
const ROW_HEIGHT = 332
/** Vertical gap between stacked “overflow” processing chips in one column. */
const OVERFLOW_CHIP_GAP = 140
const START_X = 36
const START_Y = 48
const NODE_Z = 10

function columnXs() {
  let x = START_X
  const query = x
  x += CARD_WIDTH + COLUMN_GAP
  const indexMatcher = x
  x += CARD_WIDTH + COLUMN_GAP
  const profiles = x
  x += CARD_WIDTH + COLUMN_GAP
  const personas = x
  x += CARD_WIDTH + COLUMN_GAP
  const graph = x
  x += CARD_WIDTH + COLUMN_GAP
  const output = x
  return { query, indexMatcher, profiles, personas, graph, output }
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 1.5, stroke: 'hsl(var(--primary))' },
}

function PipelineAutoFit({ layoutSig, nodeCount, rowCount }) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (nodeCount === 0) return
    const maxZoom = Math.max(0.2, 1.08 - Math.min(0.78, rowCount * 0.052))
    const padding = 0.09 + Math.min(0.26, rowCount * 0.016)
    const id = window.setTimeout(() => {
      try {
        fitView({ duration: 380, padding, maxZoom, minZoom: 0.001 })
      } catch {
        /* optional */
      }
    }, 60)
    return () => window.clearTimeout(id)
  }, [layoutSig, nodeCount, rowCount, fitView])

  return null
}

/**
 * Dynamic pipeline: audience description → profile index → rows → graph → output.
 */
function DynamicPipelineInner({ query, profiles, personas, graphState }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const { displayProfiles, overflowCount } = useMemo(() => {
    if (profiles.length <= MAX_PIPELINE_ROWS) {
      return { displayProfiles: profiles, overflowCount: 0 }
    }
    return {
      displayProfiles: profiles.slice(0, MAX_PIPELINE_ROWS),
      overflowCount: profiles.length - MAX_PIPELINE_ROWS,
    }
  }, [profiles])

  /** At most this many profile (and matching persona) rows are laid out vertically in React Flow. */
  const layoutProfiles = useMemo(
    () => displayProfiles.slice(0, MAX_PERSONA_PIPELINE_ROWS),
    [displayProfiles]
  )

  const profileRowsHiddenInDiagram = Math.max(0, displayProfiles.length - layoutProfiles.length)

  const personaSlotsUsed = useMemo(() => {
    let slot = 0
    for (const profile of layoutProfiles) {
      if (
        personas.some((p) => p.sourceProfileId === profile.id) &&
        slot < MAX_PERSONA_PIPELINE_ROWS
      ) {
        slot += 1
      }
    }
    return slot
  }, [layoutProfiles, personas])

  const personasNotDrawn = Math.max(0, personas.length - personaSlotsUsed)

  useEffect(() => {
    const COLS = columnXs()
    const newNodes = []
    const newEdges = []
    const overflowNote = overflowCount
      ? ` (${overflowCount} more in index, hidden in layout)`
      : ''

    const marker = { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }

    if (query) {
      newNodes.push({
        id: 'query',
        type: 'source',
        position: { x: COLS.query, y: START_Y + ROW_HEIGHT },
        zIndex: NODE_Z,
        data: {
          label: PIPELINE.sourceLabel,
          sourceType: 'description',
          status: 'complete',
          details: query.substring(0, 72) + (query.length > 72 ? '…' : ''),
        },
      })

      const indexStatus =
        profiles.length === 0 && graphState?.status !== 'complete' ? 'processing' : 'complete'

      newNodes.push({
        id: 'profile-index',
        type: 'processing',
        position: { x: COLS.indexMatcher, y: START_Y + ROW_HEIGHT },
        zIndex: NODE_Z,
        data: {
          label: PIPELINE.indexNodeLabel,
          processingType: 'llm',
          status: indexStatus,
          currentTask:
            indexStatus === 'processing'
              ? PIPELINE.indexMatching
              : PIPELINE.indexComplete(profiles.length, overflowNote),
          processed: profiles.length,
          total: profiles.length || '?',
        },
      })

      newEdges.push({
        id: 'query-to-index',
        source: 'query',
        target: 'profile-index',
        animated: indexStatus === 'processing',
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 1.5 },
        markerEnd: marker,
        type: 'smoothstep',
      })
    }

    let personaSlot = 0
    let lastPersonaRowY = START_Y

    layoutProfiles.forEach((profile, idx) => {
      const profileId = `profile-${profile.id || idx}`
      const y = START_Y + idx * ROW_HEIGHT

      newNodes.push({
        id: profileId,
        type: 'profile',
        position: { x: COLS.profiles, y },
        zIndex: NODE_Z,
        data: {
          ...profile,
          status: profile.status || 'scraped',
        },
      })

      newEdges.push({
        id: `index-to-${profileId}`,
        source: 'profile-index',
        target: profileId,
        animated: profile.status === 'found',
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 1.25 },
        markerEnd: marker,
        type: 'smoothstep',
      })

      const persona = personas.find((p) => p.sourceProfileId === profile.id)

      if (persona && personaSlot < MAX_PERSONA_PIPELINE_ROWS) {
        const personaId = `persona-${persona.id || idx}`
        lastPersonaRowY = y

        newNodes.push({
          id: personaId,
          type: 'persona',
          position: { x: COLS.personas, y },
          zIndex: NODE_Z,
          data: {
            ...persona,
            status: persona.status || 'ready',
          },
        })

        newEdges.push({
          id: `${profileId}-to-${personaId}`,
          source: profileId,
          target: personaId,
          animated: persona.status === 'synthesizing',
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 1.25 },
          markerEnd: marker,
          type: 'smoothstep',
        })

        if (graphState) {
          newEdges.push({
            id: `${personaId}-to-graph`,
            source: personaId,
            target: 'graph-assembly',
            animated: graphState.status === 'processing',
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 1.25 },
            markerEnd: marker,
            type: 'smoothstep',
          })
        }

        personaSlot += 1
      }
    })

    let nextProfileChipY = START_Y + layoutProfiles.length * ROW_HEIGHT + 24

    if (profileRowsHiddenInDiagram > 0) {
      newNodes.push({
        id: 'profiles-rows-hidden',
        type: 'processing',
        position: { x: COLS.profiles, y: nextProfileChipY },
        zIndex: NODE_Z,
        data: {
          label: 'More profiles',
          processingType: 'llm',
          status: 'complete',
          currentTask: PIPELINE.profileRowsHidden(profileRowsHiddenInDiagram),
          processed: profileRowsHiddenInDiagram,
          total: profileRowsHiddenInDiagram,
        },
      })
      newEdges.push({
        id: 'index-to-profiles-rows-hidden',
        source: 'profile-index',
        target: 'profiles-rows-hidden',
        animated: false,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' },
        type: 'smoothstep',
      })
      nextProfileChipY += OVERFLOW_CHIP_GAP
    }

    if (overflowCount > 0) {
      newNodes.push({
        id: 'profiles-overflow',
        type: 'processing',
        position: { x: COLS.profiles, y: nextProfileChipY },
        zIndex: NODE_Z,
        data: {
          label: 'More from index',
          processingType: 'llm',
          status: 'complete',
          currentTask: PIPELINE.profileOverflow(overflowCount),
          processed: overflowCount,
          total: overflowCount,
        },
      })
      newEdges.push({
        id: 'index-to-overflow',
        source: 'profile-index',
        target: 'profiles-overflow',
        animated: false,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' },
        type: 'smoothstep',
      })
    }

    if (personasNotDrawn > 0) {
      const personaOverflowY =
        personaSlot > 0
          ? lastPersonaRowY + ROW_HEIGHT + 24
          : START_Y + Math.min(layoutProfiles.length, 2) * ROW_HEIGHT + 24
      newNodes.push({
        id: 'personas-overflow',
        type: 'processing',
        position: { x: COLS.personas, y: personaOverflowY },
        zIndex: NODE_Z,
        data: {
          label: 'More personas',
          processingType: 'llm',
          status: 'complete',
          currentTask: PIPELINE.personaOverflow(personasNotDrawn),
          processed: personasNotDrawn,
          total: personasNotDrawn,
        },
      })
      newEdges.push({
        id: 'index-to-personas-overflow',
        source: 'profile-index',
        target: 'personas-overflow',
        animated: false,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' },
        type: 'smoothstep',
      })
    }

    if (personas.length > 0) {
      const graphStatus = graphState?.status || 'idle'
      const extraRows =
        (profileRowsHiddenInDiagram > 0 ? 1 : 0) +
        (overflowCount > 0 ? 1 : 0) +
        (personasNotDrawn > 0 ? 1 : 0)
      const graphRowSpan = Math.max(layoutProfiles.length + extraRows, 1)
      const midY = START_Y + ((graphRowSpan - 1) * ROW_HEIGHT) / 2

      newNodes.push({
        id: 'graph-assembly',
        type: 'processing',
        position: { x: COLS.graph, y: midY },
        zIndex: NODE_Z,
        data: {
          label: PIPELINE.graphLabel,
          processingType: 'graph',
          status: graphStatus,
          currentTask: graphState?.message || 'Building network graph…',
          processed: graphState?.connectionsBuilt || 0,
          total: graphState?.totalConnections || personas.length * 2,
        },
      })

      if (graphState && graphState.status === 'complete') {
        newNodes.push({
          id: 'output',
          type: 'output',
          position: { x: COLS.output, y: midY },
          zIndex: NODE_Z,
          data: {
            label: PIPELINE.outputLabel,
            status: 'complete',
            personaCount: personas.length,
            clusters: graphState.clusters || [],
            personaPreviews: personas.slice(0, 5),
          },
        })

        newEdges.push({
          id: 'graph-to-output',
          source: 'graph-assembly',
          target: 'output',
          animated: false,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          markerEnd: marker,
          type: 'smoothstep',
        })
      }
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [
    query,
    profiles,
    personas,
    graphState,
    layoutProfiles,
    overflowCount,
    profileRowsHiddenInDiagram,
    personasNotDrawn,
    setNodes,
    setEdges,
  ])

  const layoutSig = useMemo(
    () =>
      [
        query || '',
        profiles.length,
        personas.length,
        displayProfiles.length,
        layoutProfiles.length,
        overflowCount,
        profileRowsHiddenInDiagram,
        personasNotDrawn,
        graphState?.status ?? '',
        String(graphState?.connectionsBuilt ?? ''),
      ].join('|'),
    [
      query,
      profiles.length,
      personas.length,
      displayProfiles.length,
      layoutProfiles.length,
      overflowCount,
      profileRowsHiddenInDiagram,
      personasNotDrawn,
      graphState,
    ]
  )

  const rowCount = Math.max(
    layoutProfiles.length +
      (profileRowsHiddenInDiagram > 0 ? 1 : 0) +
      (overflowCount > 0 ? 1 : 0) +
      (personasNotDrawn > 0 ? 1 : 0),
    1
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.05, minZoom: 0.01 }}
        minZoom={0.001}
        maxZoom={1.25}
        proOptions={{ hideAttribution: true }}
        elevateEdgesOnSelect
      >
        <PipelineAutoFit layoutSig={layoutSig} nodeCount={nodes.length} rowCount={rowCount} />
        <Background
          color="hsl(var(--muted-foreground))"
          gap={16}
          size={1}
          variant="dots"
        />
        <Controls
          className="!bg-card !border !border-border !shadow-md [&_button]:!bg-muted [&_button]:!border-border [&_button]:!text-foreground [&_button]:!rounded-md [&_button:hover]:!bg-accent [&_button_svg]:!fill-current"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border !border-border !m-3 !rounded-md"
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => {
            switch (node.type) {
              case 'profile':
                return '#f59e0b'
              case 'persona':
                return '#6366f1'
              case 'output':
                return '#10b981'
              default:
                return '#64748b'
            }
          }}
        />
      </ReactFlow>
    </div>
  )
}

export default function DynamicPipeline(props) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <DynamicPipelineInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
