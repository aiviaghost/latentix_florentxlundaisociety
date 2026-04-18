import { Handle, Position } from 'reactflow'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Linkedin, FileText, Database } from 'lucide-react'
import { cn } from '../../lib/utils'

const iconMap = {
  linkedin: Linkedin,
  description: FileText,
  database: Database,
}

export default function SourceNode({ data }) {
  const Icon = iconMap[data.sourceType] || FileText
  const statusColors = {
    idle: 'bg-muted text-muted-foreground',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    complete: 'bg-green-500/20 text-green-400 border-green-500/50',
    error: 'bg-red-500/20 text-red-400 border-red-500/50',
  }

  return (
    <>
      <Card className={cn(
        'w-64 transition-all',
        statusColors[data.status]
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
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
          {data.count !== undefined && (
            <div className="text-xs text-muted-foreground">
              {data.sourceType === 'linkedin' ? 'Profiles' : 'Items'}: <span className="font-mono font-semibold">{data.count}</span>
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
            <div className="text-xs text-muted-foreground truncate">
              {data.details}
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
