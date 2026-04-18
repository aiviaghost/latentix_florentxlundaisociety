import { useMemo, useState } from 'react'
import SocietyGraph from './SocietyGraph'
import SimulationResultPanel from './SimulationResultPanel'
import { useSimulationPlayback } from '../hooks/useSimulationPlayback'
import { Button } from './ui/button'
import { ArrowLeft } from 'lucide-react'

export default function SimulationView({
  graphData,
  playbook,
  result,
  onBack,
}) {
  const [playbackDone, setPlaybackDone] = useState(false)

  const playbackOptions = useMemo(
    () => ({
      intervalMs: 1500,
      onComplete: () => setPlaybackDone(true),
    }),
    []
  )

  const playbookForPlayback = graphData && playbook?.length > 0 ? playbook : []

  const { simulationState, skip } = useSimulationPlayback(playbookForPlayback, playbackOptions)

  const showPlaybackChrome = playbookForPlayback.length > 0 && !playbackDone

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex-shrink-0 flex items-center gap-2 border-b border-border px-4 py-2 bg-card/80">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to builder
        </Button>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Drag to rotate, scroll to zoom
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-[40vh] flex-1 border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <SocietyGraph graphData={graphData} simulationState={simulationState} />
        </div>
        <div className="w-full shrink-0 overflow-y-auto bg-muted/20 p-3 lg:w-[min(420px,100%)]">
          <SimulationResultPanel
            headline={result?.headline}
            narrative={result?.narrative}
            summary={result?.summary}
            playbackActive={showPlaybackChrome && simulationState?.isRunning}
            onSkipPlayback={skip}
          />
        </div>
      </div>
    </div>
  )
}
