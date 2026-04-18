import { Handle, Position } from 'reactflow'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Linkedin, Building2, MapPin } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ProfileNode({ data }) {
  const statusColors = {
    idle: 'bg-muted/50 border-muted',
    found: 'bg-amber-500/10 border-amber-500/50',
    scraped: 'bg-green-500/10 border-green-500/50',
    error: 'bg-red-500/10 border-red-500/50',
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary opacity-0"
      />
      <Card className={cn(
        'w-64 transition-all animate-fade-in',
        statusColors[data.status || 'idle']
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Header with avatar and name */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              {data.avatar ? (
                <img
                  src={data.avatar}
                  alt={data.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Linkedin className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{data.name || 'Unknown'}</div>
              {data.title && (
                <div className="text-xs text-muted-foreground truncate">{data.title}</div>
              )}
              {data.status && (
                <Badge variant={data.status === 'scraped' ? 'default' : 'secondary'} className="mt-1 text-xs">
                  {data.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Company and location */}
          {(data.company || data.location) && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {data.company && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{data.company}</span>
                </div>
              )}
              {data.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{data.location}</span>
                </div>
              )}
            </div>
          )}

          {/* Skills preview */}
          {data.skills && data.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs py-0">
                  {skill}
                </Badge>
              ))}
              {data.skills.length > 3 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{data.skills.length - 3}
                </Badge>
              )}
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
