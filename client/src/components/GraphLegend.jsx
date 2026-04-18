/**
 * Explains node coloring during simulation: community palette vs live sentiment tint.
 */
export default function GraphLegend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,280px)] rounded-lg border border-border/60 bg-background/85 px-3 py-2 text-[10px] leading-snug text-muted-foreground shadow-md backdrop-blur-sm">
      <p className="font-semibold uppercase tracking-wide text-foreground/80">Node colors</p>
      <p className="mt-1.5">
        <span className="text-foreground/90">Community</span> — each persona keeps a base hue from the graph build
        (archetype / model).
      </p>
      <p className="mt-1">
        <span className="text-foreground/90">Reaction</span> — after a persona responds, their node shifts on a{' '}
        <span className="whitespace-nowrap text-rose-400">negative</span> →{' '}
        <span className="text-slate-300">neutral</span> → <span className="text-emerald-400">positive</span> scale
        (sentiment score −1…+1).
      </p>
    </div>
  )
}
