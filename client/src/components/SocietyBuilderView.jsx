import { useState, useCallback } from 'react'
import SearchInput from './SearchInput'
import DynamicPipeline from './pipeline/DynamicPipeline'
import usePipelineUpdates from '../hooks/usePipelineUpdates'
import FloatingIdeaComposer from './FloatingIdeaComposer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle2, RefreshCw, Network } from 'lucide-react'

function formatSearchError(error) {
  if (!error) return 'Search failed.'
  const msg = error.response?.data?.error || error.response?.data?.message || error.message
  return typeof msg === 'string' ? msg : 'Search failed.'
}

export default function SocietyBuilderView({ onSearch, onBeginSimulation }) {
  const [query, setQuery] = useState('')
  const [societyId, setSocietyId] = useState(null)
  const [showSearch, setShowSearch] = useState(true)
  const [searchError, setSearchError] = useState('')

  const { profiles, personas, graphState, isComplete, reset, applyUpdate } = usePipelineUpdates()

  const handleSearch = async (searchQuery, personaCount) => {
    reset()
    setQuery(searchQuery)
    setSearchError('')
    setShowSearch(false)
    setSocietyId('loading')

    try {
      const pipelineLive = import.meta.env.VITE_PIPELINE_LIVE === 'true'
      const result = await onSearch(
        searchQuery,
        personaCount,
        pipelineLive ? applyUpdate : undefined
      )

      if (result?.society_id) {
        setSocietyId(result.society_id)
      } else {
        setSearchError('Unexpected response from server.')
        setSocietyId(null)
        setShowSearch(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchError(formatSearchError(error))
      setSocietyId(null)
      setShowSearch(true)
    }
  }

  const handleReset = () => {
    setQuery('')
    setSocietyId(null)
    setShowSearch(true)
    setSearchError('')
    reset()
  }

  const handleIdeaSubmit = useCallback(
    ({ ideaPrompt }) => {
      if (!onBeginSimulation || !societyId || !graphState?.nodes?.length) {
        return
      }
      onBeginSimulation({
        societyId,
        ideaPrompt,
        audienceQuery: query,
        societySnapshot: {
          nodes: graphState.nodes,
          links: graphState.links || [],
        },
      })
    },
    [onBeginSimulation, societyId, graphState, query]
  )

  const totalNodes = profiles.length + personas.length
  const streamWaiting = !!societyId && totalNodes === 0 && !isComplete

  const showFloatingComposer =
    !showSearch && isComplete && graphState?.status === 'complete' && (graphState.nodes?.length ?? 0) > 0

  return (
    <div className="h-full w-full flex flex-col">
      {!showSearch && (
        <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-end gap-3 px-6 py-3">
            {profiles.length > 0 && (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Network className="h-3 w-3" />
                  {profiles.length} matched
                </Badge>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {personas.length} personas
                </Badge>
              </>
            )}
            {(societyId || profiles.length > 0) && (
              <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Start over
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {showSearch ? (
          <div className="h-full w-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
            <SearchInput onSearch={handleSearch} error={searchError} />
          </div>
        ) : (
          <div className="h-full w-full relative">
            <DynamicPipeline
              query={query}
              profiles={profiles}
              personas={personas}
              graphState={graphState}
            />

            {!isComplete && totalNodes > 0 && (
              <div className="absolute top-4 left-4 z-10">
                <Card className="w-64 shadow-lg glass">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Pipeline Status</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400">Active</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Profiles</span>
                        <span className="font-mono font-semibold">{profiles.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Personas</span>
                        <span className="font-mono font-semibold">{personas.length}</span>
                      </div>
                      {graphState && (
                        <div className="flex justify-between text-xs">
                          <span>Connections</span>
                          <span className="font-mono font-semibold">
                            {graphState.connectionsBuilt || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {isComplete && graphState && (
              <div className="absolute top-4 right-4 z-10 max-w-sm">
                <Card className="shadow-xl border-green-500/50 bg-green-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <CardTitle className="text-base">Audience ready</CardTitle>
                    </div>
                    <CardDescription>
                      {personas.length} personas in the network. Add your idea below to simulate how they react.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {graphState.clusters && graphState.clusters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {graphState.clusters.map((cluster, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {cluster}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {streamWaiting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
                <Card className="w-96 shadow-xl">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                      <Network className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Matching profile index…</div>
                      <div className="text-sm text-muted-foreground">
                        Resolving audience &quot;{query.substring(0, 50)}
                        {query.length > 50 ? '…' : ''}&quot; to stored profiles and personas
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {showFloatingComposer && (
              <FloatingIdeaComposer onSubmit={handleIdeaSubmit} disabled={!onBeginSimulation} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
