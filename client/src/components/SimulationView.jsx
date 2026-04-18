import SocietyGraph from './SocietyGraph'
import SimulationConsole from './SimulationConsole'
import GraphLegend from './GraphLegend'

export default function SimulationView({
  graphData,
  simSession,
  graphSimulationState,
  focusedPersonaId,
  onGraphNodeClick,
  onFollowUp,
  onAbortStream,
  onBack,
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <div className="relative flex min-h-[38vh] min-w-0 flex-1 overflow-hidden border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="pointer-events-none absolute left-3 top-2 z-10 hidden max-w-[min(calc(100%-1.5rem),320px)] rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur-sm sm:block">
            Drag to rotate · scroll to zoom · tap a node (do not drag) to focus their reaction in the console
          </div>
          <GraphLegend />
          <div className="absolute inset-0 min-h-0 min-w-0">
            <SocietyGraph
              graphData={graphData}
              simulationState={graphSimulationState}
              onNodeClick={onGraphNodeClick}
            />
          </div>
        </div>
        <div className="relative z-20 flex h-[min(52vh,560px)] w-full min-w-0 shrink-0 flex-col overflow-hidden bg-background lg:h-full lg:w-[min(480px,100%)] lg:max-w-[40vw] lg:shrink-0">
          {simSession && (
            <SimulationConsole
              status={simSession.status}
              error={simSession.error}
              rounds={simSession.rounds}
              personaResults={simSession.personaResults}
              focusedPersonaId={focusedPersonaId}
              onFollowUp={onFollowUp}
              onAbort={onAbortStream}
              onBack={onBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}
