import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Users, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function OutputNode({ data }) {
  const statusColors = {
    idle: 'bg-muted/50 border-muted',
    processing: 'bg-primary/10 border-primary/50',
    complete: 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20',
    error: 'bg-red-500/10 border-red-500/50',
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
      />
      <Card className={cn(
        'w-80 transition-all',
        statusColors[data.status]
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {data.status === 'complete' ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              <CardTitle className="text-sm">{data.label}</CardTitle>
            </div>
            {data.status !== 'idle' && (
              <Badge variant={data.status === 'complete' ? 'default' : 'secondary'} className="text-xs">
                {data.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.personaCount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Personas</span>
              <span className="text-2xl font-bold font-mono">{data.personaCount}</span>
            </div>
          )}

          {data.clusters && data.clusters.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">Clusters Detected</div>
              <div className="flex flex-wrap gap-1">
                {data.clusters.map((cluster, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {cluster}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.personaPreviews && data.personaPreviews.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">Sample Personas</div>
              <div className="space-y-1">
                {data.personaPreviews.slice(0, 3).map((persona, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-background/50">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: persona.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{persona.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{persona.archetype}</div>
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
