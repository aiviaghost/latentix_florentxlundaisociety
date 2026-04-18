import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export default function SimulationResultPanel({
  headline,
  narrative,
  summary,
  playbackActive,
  onSkipPlayback,
}) {
  if (!summary && !headline) return null

  const pct = summary?.adoption_rate != null ? Math.round(summary.adoption_rate * 100) : null

  return (
    <Card className="border-border bg-card/95 text-card-foreground shadow-xl max-h-[70vh] overflow-y-auto w-full max-w-md">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">Simulation result</CardTitle>
          {playbackActive && onSkipPlayback && (
            <Button type="button" variant="secondary" size="sm" onClick={onSkipPlayback}>
              Skip animation
            </Button>
          )}
        </div>
        {headline && <p className="text-sm text-muted-foreground leading-relaxed">{headline}</p>}
        {narrative && (
          <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
            {narrative}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {pct != null && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Adoption {pct}%</Badge>
            <Badge variant="secondary">+{summary.positive_count ?? 0}</Badge>
            <Badge variant="outline">−{summary.negative_count ?? 0}</Badge>
            <Badge variant="outline">~{summary.neutral_count ?? 0}</Badge>
          </div>
        )}

        {summary?.top_quotes?.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Voices from the network</div>
              <ul className="space-y-2">
                {summary.top_quotes.map((q, i) => (
                  <li key={i} className="rounded-md border border-border bg-muted/30 p-2 text-xs">
                    <div className="font-medium text-foreground">
                      {q.persona}
                      {q.archetype && q.archetype !== 'Unknown' && (
                        <span className="text-muted-foreground font-normal"> · {q.archetype}</span>
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground leading-relaxed">&ldquo;{q.quote}&rdquo;</p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
