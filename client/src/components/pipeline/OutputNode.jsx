import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Users, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PIPELINE_CARD_SHELL } from '../../lib/pipelineCopy'

export default function OutputNode({ data }) {
  const statusColors = {
    idle: 'bg-muted/50 border-border',
    processing: 'bg-primary/10 border-primary/50',
    complete: 'bg-green-500/10 border-green-500/50 shadow-md shadow-green-500/10',
    error: 'bg-red-500/10 border-red-500/50',
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
      />
      <Card
        className={cn(PIPELINE_CARD_SHELL, 'transition-all', statusColors[data.status] || statusColors.idle)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {data.status === 'complete' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
              ) : (
                <Users className="h-5 w-5 shrink-0 text-primary" />
              )}
              <CardTitle className="text-sm truncate">{data.label}</CardTitle>
            </div>
            {data.status !== 'idle' && (
              <Badge variant={data.status === 'complete' ? 'default' : 'secondary'} className="text-xs shrink-0">
                {data.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {data.personaCount !== undefined && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
              <span className="text-sm text-muted-foreground">Personas in graph</span>
              <span className="text-xl font-bold font-mono tabular-nums">{data.personaCount}</span>
            </div>
          )}

          {data.clusters && data.clusters.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">Clusters</div>
              <div className="flex flex-wrap gap-1">
                {data.clusters.map((cluster, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-normal">
                    {cluster}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.personaPreviews && data.personaPreviews.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">Sample personas</div>
              <div className="space-y-1.5">
                {data.personaPreviews.slice(0, 3).map((persona, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5"
                  >
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: persona.color || 'hsl(var(--primary))' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{persona.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{persona.archetype}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
