/**
 * @file Post-save session result display — shows completion percentage,
 * gate progress, and per-exercise feedback after logging a workout.
 *
 * @description
 * Rendered inside the expanded category card after a session is saved.
 * Displays an overall completion percentage with a motivational message,
 * gate progress (clean session count or "gate cleared"), and a per-exercise
 * breakdown with progress bars and gap text (e.g., "2 reps to go").
 *
 * @example
 * <SessionResult
 *   result={logSessionResult}
 *   onDone={() => collapseCard()}
 * />
 *
 * @see {@link HomeView} for the parent that manages result state
 * @see {@link LogSessionResult} for the data shape this renders
 * @see {@link getGapText} for the per-exercise shortfall text
 * @see {@link getCompletionMessage} for the motivational message logic
 */
'use client'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { getGapText, getCompletionMessage } from '@/lib/session-helpers'
import { cn } from '@/lib/utils'
import type { LogSessionResult } from '@/hooks/useGameState'

interface SessionResultProps {
  /** The result object returned by `logSession()` after saving a workout. */
  result: LogSessionResult

  /** Callback fired when the user taps "Done" to collapse the result view. */
  onDone: () => void
}

/**
 * Displays the outcome of a logged workout session.
 *
 * @description
 * Shows three sections:
 * 1. **Header** — completion percentage, color-coded progress bar, motivational message
 * 2. **Gate status** — clean session tally or "gate cleared" badge
 * 3. **Exercise breakdown** — per-exercise target met/unmet with gap text
 *
 * Progress bar color is based on completion: emerald (100%), cyan (75+%), amber (below).
 */
export function SessionResult({ result, onDone }: SessionResultProps) {
  const { sessionResult, gateProgress: gate } = result
  const pct = sessionResult.completionPct
  const message = getCompletionMessage(pct)

  return (
    <div className="session-result">
      {/* Header + completion */}
      <div className="session-result__header">
        <h2 className="session-result__title">SESSION LOGGED</h2>
        <p className="session-result__pct">{pct}%</p>
        <ProgressBar
          value={pct}
          color={pct === 100 ? 'emerald' : pct >= 75 ? 'cyan' : 'amber'}
        />
        <p className="session-result__msg">{message}</p>
      </div>

      {/* Gate progress */}
      <div className="session-result__gate">
        <span className="session-result__gate-text">
          {gate.status === 'passed'
            ? 'Gate cleared!'
            : `${gate.consecutivePasses}/3 clean sessions needed`}
        </span>
        {sessionResult.isClean && gate.status !== 'passed' && (
          <span className="session-result__clean-badge">Clean ✓</span>
        )}
      </div>

      {/* Per-exercise breakdown */}
      {sessionResult.exerciseResults.length > 0 && (
        <div className="session-result__exercises">
          {sessionResult.exerciseResults.map(er => {
            const doneSets = er.actualCheckedSets
            const totalSets = er.targetSets
            const setsPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0
            const gapText = getGapText(er)

            return (
              <div key={er.exerciseId}>
                <div className="session-result__ex-header">
                  <span className="session-result__ex-name">{er.exerciseId}</span>
                  <span className={cn(
                    'session-result__ex-status',
                    er.met ? 'session-result__ex-status--met' : 'session-result__ex-status--unmet'
                  )}>
                    {er.met ? '✓' : `${setsPct}%`}
                  </span>
                </div>
                <ProgressBar
                  value={setsPct}
                  color={er.met ? 'emerald' : 'muted'}
                />
                {gapText && (
                  <p className="session-result__gap">{gapText}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Done button */}
      <button
        onClick={onDone}
        className="btn-primary"
      >
        Done
      </button>
    </div>
  )
}
