import { cn } from '@/lib/utils'
import './node-badge.css'

type NodeState = 'locked' | 'open' | 'in-progress' | 'passed'

interface NodeBadgeProps {
  state: NodeState
  level: number
  consecutivePasses?: number
  className?: string
}

export function NodeBadge({ state, level, consecutivePasses, className }: NodeBadgeProps) {
  return (
    <div className={cn('node-badge', className)}>
      <div
        className={cn(
          'node-badge__circle',
          `node-badge__circle--${state}`,
        )}
      >
        {state === 'passed' ? '✓' : `L${level}`}
      </div>
      {state === 'in-progress' && consecutivePasses !== undefined && (
        <span className="node-badge__counter">{consecutivePasses}/3</span>
      )}
    </div>
  )
}
