import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, Brain, Network, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PIPELINE_CARD_SHELL } from '../../lib/pipelineCopy'

const iconMap = {
  llm: Brain,
  graph: Network,
}

export default function ProcessingNode({ data }) {
  const Icon = iconMap[data.processingType] || Brain
  const statusColors = {
    idle: 'bg-muted/50 border-muted',
    processing: 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/20',
    complete: 'bg-green-500/10 border-green-500/50',
    error: 'bg-red-500/10 border-red-500/50',
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
      />
      <Card className={cn(PIPELINE_CARD_SHELL, 'transition-all', statusColors[data.status])}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {data.status === 'processing' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : data.status === 'complete' ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <Icon className="h-5 w-5" />
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
        <CardContent className="space-y-2">
          {data.currentTask && (
            <div className="text-xs text-muted-foreground">
              {data.currentTask}
            </div>
          )}
          {data.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {data.processed}/{data.total}
                </span>
                <span className="font-mono font-semibold">{data.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </div>
          )}
          {data.metrics && (
            <div className="flex gap-2 flex-wrap">
              {data.metrics.map((metric, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {metric}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary"
      />
    </>
  )
}
