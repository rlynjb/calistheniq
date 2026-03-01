'use client'

import type { Category, Exercise } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { cn } from '@/lib/utils'

interface WorkoutHUDProps {
  category: Category
  level: number
  exercise: Exercise
  currentSet: number
  repCount: number
  /** Hold time in ms for plank exercises. */
  holdTimeMs: number
  /** Whether the plank position is currently being held. */
  isHolding: boolean
  isLastSet: boolean
  isLastExercise: boolean
  onNextSet: () => void
  onNextExercise: () => void
  onFinish: () => void
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function WorkoutHUD({
  category,
  level,
  exercise,
  currentSet,
  repCount,
  holdTimeMs,
  isHolding,
  isLastSet,
  isLastExercise,
  onNextSet,
  onNextExercise,
  onFinish,
}: WorkoutHUDProps) {
  const isHold = exercise.isHold

  return (
    <div className="workout-hud">
      <div className="workout-hud__exercise-info">
        <CategoryBadge category={category} />
        <span className="workout-hud__exercise-name">{exercise.name}</span>
      </div>

      {isHold ? (
        <>
          <span className="workout-hud__timer">{formatTime(holdTimeMs)}</span>
          <span className={cn(
            'workout-hud__holding',
            isHolding ? 'workout-hud__holding--active' : 'workout-hud__holding--broken'
          )}>
            {isHolding ? 'Holding' : 'Position lost'}
          </span>
          <span className="workout-hud__target">
            Target: {exercise.targetHoldSeconds}s
          </span>
        </>
      ) : (
        <>
          <span className="workout-hud__count">{repCount}</span>
          <span className="workout-hud__target">
            Target: {exercise.targetReps} reps
          </span>
        </>
      )}

      <div className="workout-hud__set-info">
        <span>Set {currentSet + 1} / {exercise.targetSets}</span>
        <span>L{level}</span>
      </div>

      <div className="workout-hud__controls">
        {!isLastSet ? (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--primary"
            onClick={onNextSet}
          >
            Next Set
          </button>
        ) : !isLastExercise ? (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--primary"
            onClick={onNextExercise}
          >
            Next Exercise
          </button>
        ) : (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--finish"
            onClick={onFinish}
          >
            Finish Workout
          </button>
        )}

        {/* Allow skipping to finish at any time */}
        {!(isLastSet && isLastExercise) && (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--secondary"
            onClick={onFinish}
          >
            Finish Early
          </button>
        )}
      </div>
    </div>
  )
}
