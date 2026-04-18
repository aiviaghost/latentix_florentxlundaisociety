import { useCallback, useMemo } from 'react'
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

const nodeTypes = {
  source: SourceNode,
  processing: ProcessingNode,
  output: OutputNode,
}

const initialNodes = [
  {
    id: 'linkedin-source',
    type: 'source',
    position: { x: 50, y: 100 },
    data: {
      label: 'LinkedIn Profiles',
      sourceType: 'linkedin',
      status: 'idle',
      count: 0,
    },
  },
  {
    id: 'description-source',
    type: 'source',
    position: { x: 50, y: 300 },
    data: {
      label: 'Text Description',
      sourceType: 'description',
      status: 'idle',
    },
  },
  {
    id: 'llm-synthesis',
    type: 'processing',
    position: { x: 400, y: 100 },
    data: {
      label: 'LLM Persona Synthesis',
      processingType: 'llm',
      status: 'idle',
    },
  },
  {
    id: 'llm-generation',
    type: 'processing',
    position: { x: 400, y: 300 },
    data: {
      label: 'LLM Persona Generation',
      processingType: 'llm',
      status: 'idle',
    },
  },
  {
    id: 'graph-assembly',
    type: 'processing',
    position: { x: 750, y: 200 },
    data: {
      label: 'Graph Assembly',
      processingType: 'graph',
      status: 'idle',
    },
  },
  {
    id: 'output',
    type: 'output',
    position: { x: 1100, y: 200 },
    data: {
      label: 'Generated Society',
      status: 'idle',
      personaCount: 0,
    },
  },
]

const initialEdges = [
  {
    id: 'linkedin-to-synthesis',
    source: 'linkedin-source',
    target: 'llm-synthesis',
    animated: false,
    style: { stroke: 'hsl(var(--primary))' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
  },
  {
    id: 'description-to-generation',
    source: 'description-source',
    target: 'llm-generation',
    animated: false,
    style: { stroke: 'hsl(var(--primary))' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
  },
  {
    id: 'synthesis-to-graph',
    source: 'llm-synthesis',
    target: 'graph-assembly',
    animated: false,
    style: { stroke: 'hsl(var(--primary))' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
  },
  {
    id: 'generation-to-graph',
    source: 'llm-generation',
    target: 'graph-assembly',
    animated: false,
    style: { stroke: 'hsl(var(--primary))' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
  },
  {
    id: 'graph-to-output',
    source: 'graph-assembly',
    target: 'output',
    animated: false,
    style: { stroke: 'hsl(var(--primary))' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--primary))',
    },
  },
]

export default function PipelineFlow({ pipelineState }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes based on pipeline state
  useMemo(() => {
    if (!pipelineState) return

    setNodes((nds) =>
      nds.map((node) => {
        const stateData = pipelineState[node.id]
        if (stateData) {
          return {
            ...node,
            data: {
              ...node.data,
              ...stateData,
            },
          }
        }
        return node
      })
    )

    // Animate edges when data flows
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceState = pipelineState[edge.source]
        const isFlowing = sourceState?.status === 'processing' || sourceState?.status === 'complete'
        return {
          ...edge,
          animated: isFlowing,
        }
      })
    )
  }, [pipelineState, setNodes, setEdges])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
            switch (node.data.status) {
              case 'complete':
                return '#10b981'
              case 'processing':
                return '#6366f1'
              case 'error':
                return '#ef4444'
              default:
                return '#64748b'
            }
          }}
        />
      </ReactFlow>
    </div>
  )
}
