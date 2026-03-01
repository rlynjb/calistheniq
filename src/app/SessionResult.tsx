'use client'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { getGapText, getCompletionMessage } from '@/lib/session-helpers'
import { cn } from '@/lib/utils'
import type { LogSessionResult } from '@/hooks/useGameState'

interface SessionResultProps {
  result: LogSessionResult
  onDone: () => void
}

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
