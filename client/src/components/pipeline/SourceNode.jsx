import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Linkedin, FileText, Database } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PIPELINE_CARD_SHELL } from '../../lib/pipelineCopy'

const iconMap = {
  linkedin: Linkedin,
  description: FileText,
  database: Database,
}

export default function SourceNode({ data }) {
  const Icon = iconMap[data.sourceType] || FileText
  const statusColors = {
    idle: 'bg-muted/50 border-border',
    processing: 'bg-primary/10 border-primary/50',
    complete: 'bg-green-500/10 border-green-500/50',
    error: 'bg-red-500/10 border-red-500/50',
  }

  return (
    <>
      <Card
        className={cn(
          PIPELINE_CARD_SHELL,
          'transition-all',
          statusColors[data.status] || statusColors.idle
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <CardTitle className="text-sm truncate">{data.label}</CardTitle>
            </div>
            {data.status !== 'idle' && (
              <Badge variant={data.status === 'complete' ? 'default' : 'secondary'} className="text-xs shrink-0">
                {data.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {data.count !== undefined && (
            <div className="text-xs text-muted-foreground">
              {data.sourceType === 'linkedin' ? 'Profiles' : 'Items'}:{' '}
              <span className="font-mono font-semibold text-foreground">{data.count}</span>
            </div>
          )}
          {data.progress !== undefined && data.status === 'processing' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
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
          {data.details && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{data.details}</p>
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
