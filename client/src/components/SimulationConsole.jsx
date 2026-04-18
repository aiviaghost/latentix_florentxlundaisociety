import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'
import { Loader2, Send, Square, MessageCircle, AlertCircle, ArrowLeft } from 'lucide-react'

const QUOTE_COLLAPSE_THRESHOLD = 4

function sentimentBarFillClass(sentiment) {
  if (sentiment === 'positive') return 'bg-emerald-500'
  if (sentiment === 'negative') return 'bg-rose-500'
  return 'bg-slate-400'
}

function sentimentBarWidth(sentiment, sentimentScore, confidence) {
  if (confidence != null && Number.isFinite(confidence)) {
    return Math.round(Math.min(1, Math.max(0, confidence)) * 100)
  }
  if (Number.isFinite(sentimentScore)) {
    return Math.round(Math.min(1, (Math.abs(sentimentScore) + 0.12) / 1.12) * 100)
  }
  if (sentiment === 'positive') return 78
  if (sentiment === 'negative') return 72
  return 48
}

function QuoteSentimentBar({ sentiment, sentimentScore, confidence }) {
  const w = sentimentBarWidth(sentiment, sentimentScore, confidence)
  const label = `Relative signal strength about ${w}% for this quote`
  return (
    <div
      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80"
      role="img"
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', sentimentBarFillClass(sentiment))}
        style={{ width: `${w}%` }}
      />
    </div>
  )
}

function SynthesisReactionMix({ positive, negative, neutral }) {
  const p = Math.max(0, Number(positive) || 0)
  const neg = Math.max(0, Number(negative) || 0)
  const neu = Math.max(0, Number(neutral) || 0)
  const total = p + neg + neu || 1
  const label = `Reaction mix: ${p} positive, ${neg} negative, ${neu} neutral or cautious`
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Reaction mix</p>
      <div
        className="flex h-3.5 w-full overflow-hidden rounded-full border border-border/60 bg-muted/25 shadow-inner"
        role="img"
        aria-label={label}
      >
        {p > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(p / total) * 100}%` }} />}
        {neg > 0 && <div className="bg-rose-500 transition-all" style={{ width: `${(neg / total) * 100}%` }} />}
        {neu > 0 && <div className="bg-slate-400 transition-all" style={{ width: `${(neu / total) * 100}%` }} />}
      </div>
    </div>
  )
}

function MeanSentimentGauge({ mean }) {
  if (!Number.isFinite(mean)) return null
  const pct = Math.round(((mean + 1) / 2) * 100)
  const label = `Mean sentiment ${mean.toFixed(2)} on a scale from negative one to positive one`
  return (
    <div className="space-y-1" role="img" aria-label={label}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Mean sentiment</p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm tabular-nums text-foreground">{mean.toFixed(2)}</span>
        <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-rose-600 via-slate-500 to-emerald-500">
          <div
            className="absolute top-0 h-full w-1 rounded-sm bg-white shadow"
            style={{ left: `calc(${pct}% - 2px)` }}
          />
        </div>
      </div>
    </div>
  )
}

function renderNarrativeParagraphs(text) {
  if (!text) return null
  const parts = text.split(/\n\n+/).filter((p) => p.trim())
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {parts.map((p, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {p.trim()}
        </p>
      ))}
    </div>
  )
}

function TranscriptBubble({ role, content, simulation, compactAssistant }) {
  const isUser = role === 'user'
  const narrative = simulation?.narrative || ''
  const firstLine = narrative.split(/\n+/).find((l) => l.trim()) || ''
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[95%] rounded-2xl border px-3 py-2.5 text-sm shadow-sm',
          isUser
            ? 'border-primary/25 bg-primary/10 text-foreground'
            : 'border-border bg-card text-card-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="space-y-2">
            {simulation?.headline && (
              <p className="font-semibold leading-snug text-foreground">{simulation.headline}</p>
            )}
            {compactAssistant ? (
              <p className="text-muted-foreground leading-relaxed text-[13px] line-clamp-2">
                {firstLine || (content || '').slice(0, 140)}
                {(firstLine || content || '').length > 140 ? '…' : ''}
              </p>
            ) : (
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-[13px]">
                {narrative.slice(0, 600)}
                {narrative.length > 600 ? '…' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function QuotesList({ quotes, title, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!quotes?.length) return null

  const useCollapsible = quotes.length > QUOTE_COLLAPSE_THRESHOLD
  const inner = (
    <ul className="space-y-2">
      {quotes.map((q, i) => (
        <li
          key={i}
          className="rounded-xl border border-border/80 bg-muted/20 p-3 text-sm shadow-sm"
        >
          <div className="font-medium text-foreground">
            {q.name}
            {q.archetype && q.archetype !== 'Unknown' && (
              <span className="text-muted-foreground font-normal"> · {q.archetype}</span>
            )}
          </div>
          <p className="mt-1.5 text-muted-foreground leading-relaxed">&ldquo;{q.quote}&rdquo;</p>
          <QuoteSentimentBar
            sentiment={q.sentiment}
            sentimentScore={q.sentiment_score}
            confidence={q.confidence}
          />
        </li>
      ))}
    </ul>
  )

  if (!useCollapsible) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-0.5">
          {title}
        </p>
        {inner}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-muted/25"
      >
        <span>
          {title} ({quotes.length})
        </span>
        <span className="text-[10px] normal-case text-primary">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? inner : null}
    </div>
  )
}

export default function SimulationConsole({
  status,
  error,
  rounds,
  personaResults = [],
  focusedPersonaId,
  onFollowUp,
  onAbort,
  onBack,
}) {
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  const completedRounds = useMemo(() => (rounds || []).filter((r) => r.assistant), [rounds])
  const pendingRound = useMemo(() => {
    const r = (rounds || [])[(rounds || []).length - 1]
    if (!r || r.assistant) return null
    return r
  }, [rounds])

  const streaming = status === 'streaming'
  const showPersonaShimmer = streaming && !reduceMotion && (personaResults?.length ?? 0) === 0

  const latestAssistant = useMemo(
    () =>
      completedRounds.length ? completedRounds[completedRounds.length - 1]?.assistant : null,
    [completedRounds]
  )

  const synthesisMetrics = latestAssistant?.metrics || {}
  const synthesisAdoptionPct =
    synthesisMetrics.adoption_rate != null
      ? Math.round(Number(synthesisMetrics.adoption_rate) * 100)
      : null

  const effectiveMeanSentiment = useMemo(() => {
    if (Number.isFinite(synthesisMetrics.mean_sentiment)) return synthesisMetrics.mean_sentiment
    const qs = latestAssistant?.quotes || []
    const scores = qs.map((q) => q.sentiment_score).filter((s) => Number.isFinite(s))
    if (!scores.length) return null
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }, [synthesisMetrics.mean_sentiment, latestAssistant?.quotes])

  const synthesisQuotes = latestAssistant?.quotes || []
  const showSynthesisCard = !streaming && !!latestAssistant

  const latestVoicesBlock = useMemo(() => {
    const quotes = synthesisQuotes
    if (!quotes.length) return null
    return (
      <QuotesList
        quotes={quotes}
        title="Voices from the network"
        defaultOpen={quotes.length <= QUOTE_COLLAPSE_THRESHOLD}
      />
    )
  }, [synthesisQuotes])

  const synthesisHighlight =
    showSynthesisCard ? (
      <Card className="border-primary/25 bg-card/95 shadow-lg ring-1 ring-primary/10">
        <CardHeader className="space-y-2 pb-2 pt-4 px-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Latest synthesis
          </div>
          {latestAssistant.headline ? (
            <CardTitle className="text-xl font-semibold leading-snug tracking-tight text-foreground">
              {latestAssistant.headline}
            </CardTitle>
          ) : null}
          {synthesisMetrics.personas_in_graph != null && synthesisMetrics.personas_surveyed != null ? (
            <p className="text-xs text-muted-foreground">
              Based on {synthesisMetrics.personas_surveyed} of {synthesisMetrics.personas_in_graph} personas in this
              society
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {synthesisAdoptionPct != null && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 font-medium text-foreground">
                Adoption {synthesisAdoptionPct}%
              </Badge>
            )}
            <Badge className="border-emerald-500/35 bg-emerald-500/15 font-medium text-emerald-100 hover:bg-emerald-500/20">
              Positive {synthesisMetrics.positive_count ?? 0}
            </Badge>
            <Badge className="border-rose-500/35 bg-rose-500/15 font-medium text-rose-100 hover:bg-rose-500/20">
              Negative {synthesisMetrics.negative_count ?? 0}
            </Badge>
            <Badge className="border-slate-400/35 bg-slate-500/15 font-medium text-slate-100 hover:bg-slate-500/20">
              Neutral {synthesisMetrics.neutral_count ?? 0}
            </Badge>
          </div>
          <SynthesisReactionMix
            positive={synthesisMetrics.positive_count}
            negative={synthesisMetrics.negative_count}
            neutral={synthesisMetrics.neutral_count}
          />
          <MeanSentimentGauge mean={effectiveMeanSentiment} />
          {latestAssistant.narrative ? renderNarrativeParagraphs(latestAssistant.narrative) : null}
          {latestAssistant.consolidated_brief ? (
            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Consolidated read
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">{latestAssistant.consolidated_brief}</p>
            </div>
          ) : null}
          {synthesisQuotes.length > 0 ? (
            <QuotesList
              quotes={synthesisQuotes}
              title="Quotes behind this summary"
              defaultOpen={synthesisQuotes.length <= QUOTE_COLLAPSE_THRESHOLD}
            />
          ) : null}
        </CardContent>
      </Card>
    ) : null

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [completedRounds.length, status, personaResults.length])

  useEffect(() => {
    if (!focusedPersonaId) return
    const root = scrollRef.current
    if (!root) return
    const esc =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(String(focusedPersonaId))
        : String(focusedPersonaId).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const row = root.querySelector(`[data-persona-row="${esc}"]`)
    row?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [focusedPersonaId, personaResults, reduceMotion])

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.()
      const el = inputRef.current
      const text = (el?.value || '').trim()
      if (!text || streaming) return
      await onFollowUp?.(text)
      if (el) el.value = ''
    },
    [streaming, onFollowUp]
  )

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-gradient-to-b from-muted/25 via-background to-background">
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-card/40 px-3 py-2 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 gap-1 px-2" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Builder</span>
            </Button>
          )}
          <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate text-sm font-medium tracking-tight">Simulation console</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {streaming && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Analyzing
            </Badge>
          )}
          {status === 'complete' && !streaming && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Ready
            </Badge>
          )}
          {status === 'error' && (
            <Badge variant="destructive" className="font-normal">
              Error
            </Badge>
          )}
          {streaming && onAbort && (
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={onAbort}>
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {completedRounds.length > 0 && (
          <div className="space-y-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-0.5">
              Conversation
            </div>
            <div className="space-y-3">
              {completedRounds.map((r, idx) => (
                <div key={idx} className="space-y-2">
                  <TranscriptBubble role="user" content={r.userText} />
                  <TranscriptBubble
                    role="assistant"
                    content=""
                    simulation={r.assistant}
                    compactAssistant={showSynthesisCard && idx === completedRounds.length - 1}
                  />
                </div>
              ))}
            </div>
            <Separator className="bg-border/60" />
          </div>
        )}

        {pendingRound && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-0.5">
              Current
            </div>
            <TranscriptBubble role="user" content={pendingRound.userText} />
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {streaming && (showPersonaShimmer || personaResults.length > 0) && (
            <Card className="border-border/80 bg-card/95">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Live persona reactions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3 pt-0">
                {showPersonaShimmer && personaResults.length === 0 && (
                  <div className="space-y-2" aria-hidden>
                    <div className={cn('h-3 rounded bg-muted', !reduceMotion && 'animate-pulse')} />
                    <div className={cn('h-3 w-[85%] rounded bg-muted', !reduceMotion && 'animate-pulse')} />
                  </div>
                )}
                <ul className="space-y-2">
                  {personaResults.map((p, i) => {
                    const rowId = p.persona_id != null ? String(p.persona_id) : ''
                    const focusStr = focusedPersonaId != null ? String(focusedPersonaId) : ''
                    const isFocus = !!rowId && !!focusStr && rowId === focusStr
                    return (
                      <li
                        key={`${rowId}-${i}`}
                        data-persona-row={rowId}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm transition-colors',
                          isFocus
                            ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/20'
                            : 'border-border/70 bg-muted/15'
                        )}
                      >
                        <div className="font-medium text-foreground">{p.name}</div>
                        <p className="mt-1 text-muted-foreground leading-relaxed">&ldquo;{p.quote}&rdquo;</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {p.reaction}
                          </Badge>
                          {Number.isFinite(p.sentiment_score) && (
                            <span className="font-mono">score {p.sentiment_score.toFixed(2)}</span>
                          )}
                        </div>
                        <QuoteSentimentBar
                          sentiment={p.reaction}
                          sentimentScore={p.sentiment_score}
                          confidence={p.confidence}
                        />
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {synthesisHighlight}

          {latestVoicesBlock && !showSynthesisCard ? latestVoicesBlock : null}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-md px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            ref={inputRef}
            rows={2}
            disabled={streaming}
            placeholder="Follow up, reframe, or resimulate with a new angle…"
            className="min-h-[72px] resize-none rounded-xl border-border/70 bg-background/80 text-sm"
          />
          <Button type="submit" disabled={streaming} className="h-11 shrink-0 gap-2 rounded-xl sm:self-end">
            {streaming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
