import { Handle, Position } from 'reactflow'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { User, Link2, TrendingUp, Shield, Lightbulb } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PIPELINE_CARD_SHELL } from '../../lib/pipelineCopy'

const traitIcons = {
  risk_tolerance: Shield,
  innovation_openness: Lightbulb,
  social_influence: TrendingUp,
}

function personaStatusBadge(data) {
  if (data.status === 'ready') {
    return { text: 'Ready', StatusIcon: null }
  }
  if (data.status === 'synthesizing' && data.pipelineStage === 'index') {
    return { text: 'Linking persona', StatusIcon: Link2 }
  }
  if (data.status === 'synthesizing') {
    return { text: 'Synthesizing', StatusIcon: null }
  }
  return { text: data.status || 'Idle', StatusIcon: null }
}

export default function PersonaNode({ data }) {
  const statusColors = {
    idle: 'bg-muted/50 border-border',
    synthesizing: 'bg-blue-500/10 border-blue-500/50',
    ready: 'bg-green-500/10 border-green-500/50',
    error: 'bg-red-500/10 border-red-500/50',
  }

  const { text: badgeText, StatusIcon } = personaStatusBadge(data)

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
      />
      <Card
        className={cn(
          PIPELINE_CARD_SHELL,
          'transition-all animate-fade-in',
          statusColors[data.status || 'idle']
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border border-border"
              style={{ backgroundColor: `${data.color || 'hsl(var(--primary))'}22` }}
            >
              <User className="h-5 w-5" style={{ color: data.color || 'hsl(var(--primary))' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{data.name || 'Persona'}</div>
              {data.archetype && (
                <div className="text-xs text-muted-foreground truncate">{data.archetype}</div>
              )}
              {data.status && (
                <Badge
                  variant={data.status === 'ready' ? 'default' : 'secondary'}
                  className="mt-1.5 text-xs gap-1"
                >
                  {StatusIcon && <StatusIcon className="h-3 w-3" />}
                  {badgeText}
                </Badge>
              )}
            </div>
          </div>

          {data.role && (
            <div className="text-xs text-muted-foreground truncate">
              {data.role}
              {data.company_type && ` · ${data.company_type}`}
            </div>
          )}

          {data.traits && (
            <div className="space-y-1.5">
              {Object.entries(data.traits).slice(0, 3).map(([key, value]) => {
                if (typeof value !== 'number') return null
                const Icon = traitIcons[key] || User
                const label = key.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">{Math.round(value * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${value * 100}%`,
                          backgroundColor: data.color || 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {data.traits?.domain_expertise && data.traits.domain_expertise.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.traits.domain_expertise.slice(0, 3).map((domain, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs py-0 font-normal">
                  {domain}
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
