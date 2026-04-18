import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Search, Loader2, Sparkles } from 'lucide-react'

const AUDIENCE_SIZES = [
  { label: 'Small', value: 10 },
  { label: 'Medium', value: 50 },
  { label: 'Large', value: 100 },
]

export default function SearchInput({ onSearch, loading, error }) {
  const [query, setQuery] = useState('')
  const [audienceSize, setAudienceSize] = useState(50)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), audienceSize)
    }
  }

  const wordCount = query.trim().split(/\s+/).filter((w) => w).length

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Search className="h-6 w-6 text-primary" aria-hidden />
          Build your audience
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Who is your audience? Describe them in plain language—we match your description to indexed profiles and build
          a synthetic network you can test ideas on.
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
              placeholder="e.g. Product managers at mid-size EU fintechs, ex-consulting, active on LinkedIn about AI compliance"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={5}
              disabled={loading}
              className="resize-none text-base"
              required
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              {query.trim() && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Ready when you are
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Audience size</label>
            <div className="flex gap-2">
              {AUDIENCE_SIZES.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAudienceSize(value)}
                  disabled={loading}
                  className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                    audienceSize === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                  <span className="ml-1 text-xs opacity-60">({value})</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading || !query.trim()} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Building…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Build audience
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
