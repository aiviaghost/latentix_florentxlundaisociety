import { useState } from 'react'
import SocietyGraph from './components/SocietyGraph'
import CreatePanel from './components/CreatePanel'
import SimulationPanel from './components/SimulationPanel'
import ResultsPanel from './components/ResultsPanel'
import PersonaDetail from './components/PersonaDetail'
import ActivityFeed from './components/ActivityFeed'
import useSociety from './hooks/useSociety'
import useSimulation from './hooks/useSimulation'

function App() {
  const [selectedNode, setSelectedNode] = useState(null)
  const { society, loading: societyLoading, generateSociety } = useSociety()
  const { simulationState, runSimulation, isRunning } = useSimulation(society)

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Latentix
        </h1>
        <p className="text-sm text-slate-400">AI Synthetic Market Simulator</p>
      </header>

      {/* Main Layout: 3 columns */}
      <div className="flex h-full pt-20">
        {/* Left Panel - Society Creation */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 overflow-y-auto">
          <CreatePanel
            onGenerate={generateSociety}
            loading={societyLoading}
            disabled={isRunning}
          />

          {society && (
            <SimulationPanel
              onSimulate={runSimulation}
              loading={isRunning}
              disabled={!society || isRunning}
            />
          )}
        </div>

        {/* Center - 3D Graph */}
        <div className="flex-1 relative">
          <SocietyGraph
            graphData={society}
            simulationState={simulationState}
            onNodeClick={setSelectedNode}
          />

          {/* Activity Feed - Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0">
            <ActivityFeed activities={simulationState?.activities || []} />
          </div>
        </div>

        {/* Right Panel - Results & Details */}
        <div className="w-96 flex-shrink-0 border-l border-slate-800 overflow-y-auto">
          {selectedNode && (
            <PersonaDetail
              persona={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {simulationState?.summary && (
            <ResultsPanel results={simulationState.summary} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
