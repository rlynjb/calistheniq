'use client'

import { cn } from '@/lib/utils'

interface SetCameraHUDProps {
  exerciseName: string
  setLabel: string
  isHold: boolean
  repCount: number
  holdTimeMs: number
  targetValue: number
  targetReached: boolean
  isHolding: boolean
  countdown: number | null
  onStart: () => void
  onDone: () => void
  onCancel: () => void
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function SetCameraHUD({
  exerciseName,
  setLabel,
  isHold,
  repCount,
  holdTimeMs,
  targetValue,
  targetReached,
  countdown,
  isHolding,
  onStart,
  onDone,
  onCancel,
}: SetCameraHUDProps) {
  // Waiting for user to tap Start
  if (countdown === null) {
    return (
      <div className="set-camera-hud">
        <span className="set-camera-hud__exercise">{exerciseName}</span>
        <span className="set-camera-hud__set-label">{setLabel}</span>
        <div className="set-camera-hud__actions">
          <button
            type="button"
            className="set-camera-hud__btn set-camera-hud__btn--start"
            onClick={onStart}
          >
            Start
          </button>
          <button
            type="button"
            className="set-camera-hud__btn set-camera-hud__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Counting down
  if (countdown > 0) {
    return (
      <div className="set-camera-hud">
        <span className="set-camera-hud__exercise">{exerciseName}</span>
        <span className="set-camera-hud__countdown">{countdown}</span>
        <span className="set-camera-hud__countdown-label">Get ready...</span>
        <span className="set-camera-hud__set-label">{setLabel}</span>
        <div className="set-camera-hud__actions">
          <button
            type="button"
            className="set-camera-hud__btn set-camera-hud__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="set-camera-hud">
      <span className="set-camera-hud__exercise">{exerciseName}</span>

      {isHold ? (
        <>
          <span className={cn(
            'set-camera-hud__timer',
            targetReached && 'set-camera-hud__value--reached'
          )}>
            {formatTime(holdTimeMs)}
          </span>
          <span className={cn(
            'set-camera-hud__holding',
            isHolding ? 'set-camera-hud__holding--active' : 'set-camera-hud__holding--broken'
          )}>
            {isHolding ? 'Holding' : 'Position lost'}
          </span>
          <span className="set-camera-hud__target">Target: {targetValue}s</span>
        </>
      ) : (
        <>
          <span className={cn(
            'set-camera-hud__count',
            targetReached && 'set-camera-hud__value--reached'
          )}>
            {repCount}
          </span>
          <span className="set-camera-hud__target">Target: {targetValue} reps</span>
        </>
      )}

      <span className="set-camera-hud__set-label">{setLabel}</span>

      <div className="set-camera-hud__actions">
        <button
          type="button"
          className="set-camera-hud__btn set-camera-hud__btn--done"
          onClick={onDone}
        >
          Done
        </button>
        <button
          type="button"
          className="set-camera-hud__btn set-camera-hud__btn--cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
