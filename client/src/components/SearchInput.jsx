import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Search, Loader2, Sparkles } from 'lucide-react'

export default function SearchInput({ onSearch, loading, error }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const wordCount = query.trim().split(/\s+/).filter(w => w).length

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Society audience
        </CardTitle>
        <CardDescription>
          Describe the society you want to simulate. We match your description to stored LinkedIn profiles
          in our index and attach each profile&apos;s pre-built persona, then assemble the graph.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Textarea
              placeholder="e.g., European B2B SaaS founders, 25-40 years old, working in fintech or AI, with product management background"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={5}
              disabled={loading}
              className="resize-none text-base"
              required
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              {query && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Matches index + pre-built personas
                </span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting build…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Build society from description
              </>
            )}
          </Button>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <p className="text-xs font-medium text-foreground">How it works:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 ml-4 list-disc">
              <li>Profiles are matched from a pre-scraped index (not live LinkedIn)</li>
              <li>Each hit pairs a stored profile with its pre-generated persona</li>
              <li>Graph assembly connects personas; the 3D view is the handoff for exploration</li>
              <li>The pipeline animates the stages; demo mode runs entirely in the browser</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
