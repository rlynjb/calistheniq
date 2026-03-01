'use client'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { getCompletionMessage } from '@/lib/session-helpers'
import { cn } from '@/lib/utils'
import type { LogSessionResult } from '@/hooks/useGameState'
import type { Exercise } from '@/types'

interface WorkoutResultProps {
  result: LogSessionResult
  exercises: Exercise[]
  repCounts: number[][]
  holdTimes: number[][]
  onDone: () => void
}

export function WorkoutResult({
  result,
  exercises,
  repCounts,
  holdTimes,
  onDone,
}: WorkoutResultProps) {
  const { sessionResult, gateProgress: gate } = result
  const pct = sessionResult.completionPct
  const message = getCompletionMessage(pct)

  return (
    <div className="workout-result">
      <div className="workout-result__header">
        <h2 className="workout-result__title">Workout Complete</h2>
        <p className="workout-result__pct">{pct}%</p>
        <ProgressBar
          value={pct}
          color={pct === 100 ? 'emerald' : pct >= 75 ? 'cyan' : 'amber'}
        />
        <p className="workout-result__msg">{message}</p>
      </div>

      <div className="workout-result__gate">
        <span className="workout-result__gate-text">
          {gate.status === 'passed'
            ? 'Gate cleared!'
            : `${gate.consecutivePasses}/3 clean sessions`}
        </span>
        {sessionResult.isClean && gate.status !== 'passed' && (
          <span className="workout-result__clean-badge">Clean</span>
        )}
      </div>

      <div className="workout-result__exercises">
        {exercises.map((ex, exIdx) => {
          const reps = repCounts[exIdx] ?? []
          const holds = holdTimes[exIdx] ?? []
          const gatResult = sessionResult.exerciseResults.find(r => r.exerciseId === ex.id)
          const met = gatResult?.met ?? false

          return (
            <div key={ex.id} className="workout-result__ex-row">
              <div className="workout-result__ex-header">
                <span className="workout-result__ex-name">{ex.name}</span>
                <span className={cn(
                  'workout-result__ex-status',
                  met ? 'workout-result__ex-status--met' : 'workout-result__ex-status--unmet'
                )}>
                  {met ? 'Met' : 'Not met'}
                </span>
              </div>
              <ProgressBar
                value={gatResult ? Math.round(
                  (gatResult.actualCheckedSets / gatResult.targetSets) * 100
                ) : 0}
                color={met ? 'emerald' : 'muted'}
              />
              <div className="workout-result__ex-sets">
                {Array.from({ length: ex.targetSets }).map((_, setIdx) => (
                  <span key={setIdx}>
                    S{setIdx + 1}:{' '}
                    {ex.isHold
                      ? `${Math.round((holds[setIdx] ?? 0) / 1000)}s/${ex.targetHoldSeconds}s`
                      : `${reps[setIdx] ?? 0}/${ex.targetReps}`
                    }
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={onDone} className="btn-primary">
        Done
      </button>
    </div>
  )
}
