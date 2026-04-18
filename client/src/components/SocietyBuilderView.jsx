import { useState } from 'react'
import SearchInput from './SearchInput'
import DynamicPipeline from './pipeline/DynamicPipeline'
import usePipelineUpdates from '../hooks/usePipelineUpdates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle2, Eye, RefreshCw, Network } from 'lucide-react'

export default function SocietyBuilderView({ onSearch, loading }) {
  const [query, setQuery] = useState('')
  const [societyId, setSocietyId] = useState(null)
  const [showSearch, setShowSearch] = useState(true)

  const { profiles, personas, graphState, isComplete, reset } = usePipelineUpdates(
    societyId,
    !!societyId
  )

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery)
    setShowSearch(false)

    try {
      // Call backend to start society generation
      const result = await onSearch(searchQuery)

      // Backend should return a society_id for tracking
      if (result && result.society_id) {
        setSocietyId(result.society_id)
      }
    } catch (error) {
      console.error('Search failed:', error)
      // Show error and reset
      setShowSearch(true)
    }
  }

  const handleReset = () => {
    setQuery('')
    setSocietyId(null)
    setShowSearch(true)
    reset()
  }

  const totalNodes = profiles.length + personas.length

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Society Builder</h1>
              <p className="text-sm text-muted-foreground">
                LinkedIn Profile Discovery → Persona Synthesis → Network Assembly
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profiles.length > 0 && (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <Network className="h-3 w-3" />
                    {profiles.length} Profiles Found
                  </Badge>
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {personas.length} Personas Synthesized
                  </Badge>
                </>
              )}
              {(societyId || profiles.length > 0) && (
                <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  New Search
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {showSearch ? (
          /* Search Input View */
          <div className="h-full w-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
            <SearchInput onSearch={handleSearch} loading={loading} />
          </div>
        ) : (
          /* Pipeline View */
          <div className="h-full w-full relative">
            {/* Pipeline canvas */}
            <DynamicPipeline
              query={query}
              profiles={profiles}
              personas={personas}
              graphState={graphState}
            />

            {/* Floating status card */}
            {!isComplete && totalNodes > 0 && (
              <div className="absolute top-4 left-4">
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

            {/* Success overlay when complete */}
            {isComplete && graphState && (
              <div className="absolute top-4 right-4">
                <Card className="w-80 shadow-xl border-green-500/50 bg-green-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <CardTitle className="text-base">Society Complete!</CardTitle>
                    </div>
                    <CardDescription>
                      {personas.length} personas connected in a network graph
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {graphState.clusters && graphState.clusters.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Detected Clusters:</div>
                        <div className="flex flex-wrap gap-1">
                          {graphState.clusters.map((cluster, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cluster}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      View 3D Network
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty state during initial loading */}
            {totalNodes === 0 && loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="w-96 shadow-xl">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                      <Network className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Searching LinkedIn...</div>
                      <div className="text-sm text-muted-foreground">
                        Finding profiles that match "{query.substring(0, 50)}"
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
