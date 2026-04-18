import { useState, useCallback } from 'react'
import SocietyBuilderView from './components/SocietyBuilderView'
import SocietyGraph from './components/SocietyGraph'
import api from './api/client'
import { isPipelineLive } from './lib/pipelineConfig'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from './components/ui/button'

function App() {
  const [loading, setLoading] = useState(false)
  const [networkGraph, setNetworkGraph] = useState(null)

  const handleSearch = useCallback(async (query) => {
    if (isPipelineLive()) {
      setLoading(true)
      try {
        return await api.searchLinkedIn(query)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 380))
    setLoading(false)
    return {
      society_id: `sim_${Date.now()}`,
      status: 'processing',
      message: 'Demo pipeline: index match + pre-built personas (set VITE_PIPELINE_LIVE=true for live API)',
    }
  }, [])

  const handleOpenNetwork = useCallback((data) => {
    if (data?.nodes?.length) {
      setNetworkGraph({ nodes: data.nodes, links: data.links || [] })
    }
  }, [])

  const handleCloseNetwork = useCallback(() => {
    setNetworkGraph(null)
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Latentix</h1>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                AI Synthetic Market Simulator
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {networkGraph ? '3D network' : 'Phase 1: Society Builder'}
              </div>
              {!isPipelineLive() && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 border border-border rounded px-1.5 py-0.5">
                  Demo index pipeline
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <SocietyBuilderView
          onSearch={handleSearch}
          loading={loading}
          pipelineLive={isPipelineLive()}
          onOpenNetwork={handleOpenNetwork}
        />

        {networkGraph && (
          <div className="absolute inset-0 z-20 flex flex-col bg-background">
            <div className="flex-shrink-0 flex items-center gap-2 border-b border-border px-4 py-2 bg-card/80">
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleCloseNetwork}>
                <ArrowLeft className="h-4 w-4" />
                Back to pipeline
              </Button>
              <span className="text-sm text-muted-foreground">Drag to rotate, scroll to zoom</span>
            </div>
            <div className="flex-1 min-h-0">
              <SocietyGraph graphData={networkGraph} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
