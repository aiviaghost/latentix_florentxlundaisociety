import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

const MIN_TEXTAREA_PX = 52
const getMaxTextareaPx = () => Math.round(window.innerHeight * 0.3)

/**
 * ChatGPT-style bottom dock: outer wrapper is pointer-events-none so React Flow
 * stays interactive; only the shell captures clicks.
 */
export default function FloatingIdeaComposer({ onSubmit, disabled }) {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const taRef = useRef(null)

  const syncTextareaHeight = useCallback(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxPx = getMaxTextareaPx()
    const next = Math.min(el.scrollHeight, maxPx)
    el.style.height = `${Math.max(MIN_TEXTAREA_PX, next)}px`
    el.style.overflowY = el.scrollHeight > maxPx ? 'auto' : 'hidden'
  }, [])

  useLayoutEffect(() => {
    syncTextareaHeight()
  }, [idea, syncTextareaHeight])

  useLayoutEffect(() => {
    const onResize = () => syncTextareaHeight()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [syncTextareaHeight])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = idea.trim()
    if (!trimmed || !onSubmit) return
    setError('')
    setLoading(true)
    try {
      await onSubmit({ ideaPrompt: trimmed })
      setIdea('')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-5 pt-8">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-xl',
          'rounded-2xl border border-border/60 bg-card/75 shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.35),0_0_0_1px_hsl(var(--primary)/0.12)]',
          'backdrop-blur-xl backdrop-saturate-150',
          'ring-1 ring-white/5 dark:ring-white/10'
        )}
      >
        <div className="rounded-2xl bg-gradient-to-b from-card/90 to-card/70 px-3 py-2.5 sm:px-4 sm:py-3">
          {error && (
            <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                <span>Test on this society</span>
              </div>
              <Textarea
                ref={taRef}
                id="floating-idea"
                rows={1}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                disabled={loading || disabled}
                placeholder="Product, pitch, or message to get reactions…"
                className={cn(
                  'min-h-[52px] max-h-[30vh] resize-none rounded-xl border-border/50 bg-background/40 py-2.5 text-sm',
                  'placeholder:text-muted-foreground/65',
                  'transition-[height,background-color,box-shadow,border-color] duration-150 ease-out',
                  'focus-visible:border-primary/35 focus-visible:bg-background/80 focus-visible:ring-primary/25',
                  'disabled:opacity-60'
                )}
              />
            </div>
            <Button
              type="submit"
              size="default"
              disabled={loading || disabled || !idea.trim()}
              className={cn(
                'h-11 shrink-0 gap-2 rounded-xl px-5 font-medium shadow-md sm:h-[52px] sm:self-end',
                'bg-primary text-primary-foreground hover:bg-primary/92'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 opacity-90" />
                  Simulate
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
