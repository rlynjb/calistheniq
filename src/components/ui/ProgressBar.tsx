import { cn } from '@/lib/utils'
import './progress-bar.css'

interface ProgressBarProps {
  value: number      // 0–100
  color?: 'cyan' | 'emerald' | 'amber' | 'muted'
  label?: string
  showPct?: boolean
  className?: string
}

export function ProgressBar({ value, color = 'cyan', label, showPct, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('progress-bar', className)}>
      {(label || showPct) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showPct && <span className="progress-bar__pct">{clamped}%</span>}
        </div>
      )}
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${clamped}%`}
      >
        <div
          className={cn('progress-bar__fill', `progress-bar__fill--${color}`)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
