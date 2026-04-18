import { useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
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

/** Max profile+persona rows before collapsing (layout + perf). */
const MAX_PIPELINE_ROWS = 12

/** Layout: card column width (matches Tailwind w-72) + horizontal/vertical rhythm. */
const CARD_WIDTH = 288
const COLUMN_GAP = 160
const ROW_HEIGHT = 228
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

/**
 * Dynamic pipeline: audience description → profile index → rows → graph → output.
 */
export default function DynamicPipeline({ query, profiles, personas, graphState }) {
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

    displayProfiles.forEach((profile, idx) => {
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

      if (persona) {
        const personaId = `persona-${persona.id || idx}`

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
      }
    })

    if (overflowCount > 0) {
      const overflowY = START_Y + displayProfiles.length * ROW_HEIGHT + 24
      newNodes.push({
        id: 'profiles-overflow',
        type: 'processing',
        position: { x: COLS.profiles, y: overflowY },
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

    if (personas.length > 0) {
      const graphStatus = graphState?.status || 'idle'
      const rowCount = Math.max(displayProfiles.length, 1)
      const midY = START_Y + ((rowCount - 1) * ROW_HEIGHT) / 2

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
            personaPreviews: personas.slice(0, 3),
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
  }, [query, profiles, personas, graphState, displayProfiles, overflowCount, setNodes, setEdges])

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
        fitViewOptions={{ padding: 0.32, maxZoom: 1.1, minZoom: 0.2 }}
        minZoom={0.15}
        maxZoom={1.25}
        proOptions={{ hideAttribution: true }}
        elevateEdgesOnSelect
      >
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
