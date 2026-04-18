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

const nodeTypes = {
  source: SourceNode,
  processing: ProcessingNode,
  output: OutputNode,
  profile: ProfileNode,
  persona: PersonaNode,
}

/**
 * Dynamic pipeline that builds nodes as data streams in
 *
 * Layout:
 * [Query] → [LinkedIn Scraper] → [Profiles...] → [Personas...] → [Graph Assembly] → [Output]
 */
export default function DynamicPipeline({ query, profiles, personas, graphState }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Build dynamic pipeline based on current data
  useEffect(() => {
    const newNodes = []
    const newEdges = []

    // Column positions
    const COLS = {
      query: 50,
      scraper: 350,
      profiles: 650,
      personas: 1000,
      graph: 1350,
      output: 1700,
    }

    const ROW_HEIGHT = 150
    const START_Y = 50

    // 1. Query node (always present if query exists)
    if (query) {
      newNodes.push({
        id: 'query',
        type: 'source',
        position: { x: COLS.query, y: 200 },
        data: {
          label: 'Search Query',
          sourceType: 'database',
          status: 'complete',
          details: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
        },
      })

      // 2. LinkedIn scraper node
      const scraperStatus = profiles.length === 0 && graphState?.status !== 'complete'
        ? 'processing'
        : 'complete'

      newNodes.push({
        id: 'linkedin-scraper',
        type: 'processing',
        position: { x: COLS.scraper, y: 200 },
        data: {
          label: 'LinkedIn Scraper',
          processingType: 'llm',
          status: scraperStatus,
          currentTask: scraperStatus === 'processing' ? 'Searching profiles...' : `Found ${profiles.length} profiles`,
          processed: profiles.length,
          total: profiles.length || '?',
        },
      })

      newEdges.push({
        id: 'query-to-scraper',
        source: 'query',
        target: 'linkedin-scraper',
        animated: scraperStatus === 'processing',
        style: { stroke: 'hsl(var(--primary))' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
      })
    }

    // 3. Profile nodes (dynamic, stacked vertically)
    profiles.forEach((profile, idx) => {
      const profileId = `profile-${profile.id || idx}`

      newNodes.push({
        id: profileId,
        type: 'profile',
        position: {
          x: COLS.profiles,
          y: START_Y + idx * ROW_HEIGHT,
        },
        data: {
          ...profile,
          status: profile.status || 'scraped',
        },
      })

      // Edge from scraper to profile
      newEdges.push({
        id: `scraper-to-${profileId}`,
        source: 'linkedin-scraper',
        target: profileId,
        animated: profile.status === 'found',
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
      })

      // 4. Persona node (1:1 mapping from profile)
      const persona = personas.find(p => p.id === profile.id || p.sourceProfileId === profile.id)

      if (persona) {
        const personaId = `persona-${persona.id || idx}`

        newNodes.push({
          id: personaId,
          type: 'persona',
          position: {
            x: COLS.personas,
            y: START_Y + idx * ROW_HEIGHT,
          },
          data: {
            ...persona,
            status: persona.status || 'ready',
          },
        })

        // Edge from profile to persona
        newEdges.push({
          id: `${profileId}-to-${personaId}`,
          source: profileId,
          target: personaId,
          animated: persona.status === 'synthesizing',
          style: { stroke: 'hsl(var(--primary))' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
        })

        // Edge from persona to graph assembly
        if (graphState) {
          newEdges.push({
            id: `${personaId}-to-graph`,
            source: personaId,
            target: 'graph-assembly',
            animated: graphState.status === 'processing',
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 1 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
          })
        }
      }
    })

    // 5. Graph assembly node (appears when personas exist)
    if (personas.length > 0) {
      const graphStatus = graphState?.status || 'idle'

      newNodes.push({
        id: 'graph-assembly',
        type: 'processing',
        position: {
          x: COLS.graph,
          y: START_Y + (Math.max(profiles.length - 1, 0) * ROW_HEIGHT / 2),
        },
        data: {
          label: 'Graph Assembly',
          processingType: 'graph',
          status: graphStatus,
          currentTask: graphState?.message || 'Building network...',
          processed: graphState?.connectionsBuilt || 0,
          total: graphState?.totalConnections || personas.length * 2,
        },
      })

      // 6. Output node (final result)
      if (graphState && graphState.status === 'complete') {
        newNodes.push({
          id: 'output',
          type: 'output',
          position: {
            x: COLS.output,
            y: START_Y + (Math.max(profiles.length - 1, 0) * ROW_HEIGHT / 2),
          },
          data: {
            label: '3D Network Graph',
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
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
        })
      }
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [query, profiles, personas, graphState, setNodes, setEdges])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="hsl(var(--muted-foreground))"
          gap={16}
          size={1}
          variant="dots"
        />
        <Controls className="!bg-card !border-border" />
        <MiniMap
          className="!bg-card !border-border"
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
