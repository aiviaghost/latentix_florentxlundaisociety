import { useState } from 'react'
import SocietyBuilderView from './components/SocietyBuilderView'
import api from './api/client'
import { Sparkles } from 'lucide-react'

function App() {
  const [loading, setLoading] = useState(false)
  const [currentPhase, setCurrentPhase] = useState('builder') // 'builder' | 'simulation'

  const handleSearch = async (query) => {
    setLoading(true)
    try {
      // Call new simplified API
      const result = await api.searchLinkedIn(query)
      return result
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Global Header */}
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

            {/* Phase indicator */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                Phase 1: Society Builder
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <SocietyBuilderView onSearch={handleSearch} loading={loading} />
        {/* Phase 2 (Simulation) can be added here later */}
      </main>
    </div>
  )
}

export default App
