'use client'

import { useState, useMemo } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { Category, Exercise, ExerciseEntry, WorkoutSession } from '@/types'
import { CATEGORIES } from '@/types'
import type { LogSessionResult } from '@/hooks/useGameState'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { GlowCard } from '@/components/ui/GlowCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SetCheckbox } from '@/components/ui/SetCheckbox'
import { GatePassedModal } from '@/components/GatePassedModal'
import { LEVEL_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import exerciseData from '@/data/exercises.json'

const typedExercises = exerciseData as Exercise[]

export default function HomePage() {
  const {
    status, user, categoryDoneThisWeek, weekComplete,
    completedThisWeek, streak, sessions, getGateForCategory, logSession,
  } = useGameState()

  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null)
  const [result, setResult] = useState<LogSessionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [levelUpInfo, setLevelUpInfo] = useState<{
    category: Category; oldLevel: number; newLevel: number
  } | null>(null)

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-tron-muted text-sm font-mono">
        Loading...
      </div>
    )
  }

  if (status === 'error' || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-tron-muted text-sm font-mono">
        <p>Failed to load data</p>
      </div>
    )
  }

  const handleToggleCategory = (cat: Category) => {
    if (expandedCategory === cat) {
      setExpandedCategory(null)
      setResult(null)
      return
    }
    if (categoryDoneThisWeek[cat]) return
    setExpandedCategory(cat)
    setResult(null)
    setSaving(false)
    setSaveError(null)
  }

  const handleSave = async (session: WorkoutSession) => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await logSession(session)
      setResult(res)
      if (res.leveledUp && res.newLevel) {
        setLevelUpInfo({
          category: session.category,
          oldLevel: session.level,
          newLevel: res.newLevel,
        })
      }
    } catch {
      setSaveError('Failed to save session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDone = () => {
    setExpandedCategory(null)
    setResult(null)
  }

  const remaining = 3 - completedThisWeek

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header: streak + week progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-wide text-tron-text">This Week</h1>
          <p className="text-xs text-tron-muted mt-0.5">
            {completedThisWeek}/3 sessions
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tron-warning-dim border border-tron-warning/20">
            <span className="text-tron-warning text-sm font-bold">{streak}</span>
            <span className="text-tron-warning/70 text-[10px] font-medium">week streak</span>
          </div>
        )}
      </div>

      {/* Overall week progress bar */}
      <div>
        <ProgressBar
          value={Math.round((completedThisWeek / 3) * 100)}
          color={weekComplete ? 'emerald' : 'cyan'}
          label={weekComplete ? 'Week complete!' : `${completedThisWeek} of 3`}
        />
        {!weekComplete && (
          <p className="text-[11px] text-tron-muted mt-1">
            {remaining} session{remaining !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Category rows */}
      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const done = categoryDoneThisWeek[cat]
          const level = user.levels[cat]
          const gate = getGateForCategory(cat)
          const passes = gate?.consecutivePasses ?? 0
          const isExpanded = expandedCategory === cat
          const showResult = isExpanded && result !== null
          const isDimmed = done && !isExpanded

          return (
            <GlowCard
              key={cat}
              glow={isDimmed ? 'none' : isExpanded ? cat : 'none'}
              className={cn('p-0', isDimmed && 'opacity-60')}
            >
              {/* Tappable category header */}
              <div
                className={cn(
                  'p-4',
                  !isDimmed && 'cursor-pointer',
                )}
                onClick={() => { if (!isDimmed) handleToggleCategory(cat) }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={cat} />
                    <div>
                      <p className="text-sm font-semibold text-tron-text">
                        Level {level}
                        <span className="text-tron-muted font-normal ml-1.5 text-xs">
                          {LEVEL_NAMES[level] ?? ''}
                        </span>
                      </p>
                      <p className="text-[11px] text-tron-muted mt-0.5">
                        {isDimmed
                          ? '✓ Done this week'
                          : isExpanded
                            ? (showResult ? 'Session logged' : 'Logging...')
                            : `${passes}/3 clean sessions · Tap to log`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isDimmed ? (
                      <span className="text-tron-success text-sm">✓</span>
                    ) : (
                      <ChevronIcon expanded={isExpanded} />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: exercise form */}
              {isExpanded && !showResult && (
                <div className="border-t border-tron-border">
                  <InlineExerciseForm
                    category={cat}
                    level={level}
                    sessions={sessions}
                    saving={saving}
                    saveError={saveError}
                    onSave={handleSave}
                  />
                </div>
              )}

              {/* Expanded: inline result */}
              {isExpanded && showResult && result && (
                <div className="border-t border-tron-border">
                  <InlineResult
                    result={result}
                    onDone={handleDone}
                  />
                </div>
              )}
            </GlowCard>
          )
        })}
      </div>

      {/* Week complete banner (only when nothing expanded) */}
      {weekComplete && !expandedCategory && (
        <div className="rounded-xl border border-tron-success/30 bg-tron-success-dim py-3.5 text-center text-sm font-semibold text-tron-success">
          All sessions logged this week!
        </div>
      )}

      {/* Level up modal */}
      {levelUpInfo && (
        <GatePassedModal
          category={levelUpInfo.category}
          oldLevel={levelUpInfo.oldLevel}
          newLevel={levelUpInfo.newLevel}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  )
}

// ── Chevron Icon ────────────────────────────────────────────

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'text-tron-muted transition-transform duration-200',
        expanded && 'rotate-180'
      )}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Inline Exercise Form ────────────────────────────────────

function InlineExerciseForm({
  category,
  level,
  sessions,
  saving,
  saveError,
  onSave,
}: {
  category: Category
  level: number
  sessions: WorkoutSession[]
  saving: boolean
  saveError: string | null
  onSave: (session: WorkoutSession) => void
}) {
  const levelExercises = useMemo(
    () => typedExercises.filter(e => e.category === category && e.level === level),
    [category, level]
  )

  // Find last session for this category+level to pre-fill inputs
  const lastSession = useMemo(() => {
    return sessions
      .filter(s => s.category === category && s.level === level)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
  }, [sessions, category, level])

  const [exerciseState, setExerciseState] = useState(() =>
    levelExercises.map(ex => {
      const lastEntry = lastSession?.exercises.find(e => e.exerciseId === ex.id)
      return {
        exerciseId: ex.id,
        checkedSets: Array(ex.targetSets).fill(false) as boolean[],
        actualReps: lastEntry
          ? [...lastEntry.actualReps]
          : Array(ex.targetSets).fill(ex.targetReps) as number[],
        actualHoldSeconds: ex.isHold
          ? (lastEntry?.actualHoldSeconds
              ? [...lastEntry.actualHoldSeconds]
              : Array(ex.targetSets).fill(ex.targetHoldSeconds ?? 0) as number[])
          : undefined,
      }
    })
  )

  const [notes, setNotes] = useState('')

  const toggleSet = (exIdx: number, setIdx: number) => {
    setExerciseState(prev => {
      const next = [...prev]
      const ex = { ...next[exIdx] }
      ex.checkedSets = [...ex.checkedSets]
      ex.checkedSets[setIdx] = !ex.checkedSets[setIdx]
      next[exIdx] = ex
      return next
    })
  }

  const updateValue = (exIdx: number, setIdx: number, value: number, isHold: boolean) => {
    setExerciseState(prev => {
      const next = [...prev]
      const ex = { ...next[exIdx] }
      if (isHold) {
        ex.actualHoldSeconds = [...(ex.actualHoldSeconds ?? [])]
        ex.actualHoldSeconds[setIdx] = value
      } else {
        ex.actualReps = [...ex.actualReps]
        ex.actualReps[setIdx] = value
      }
      next[exIdx] = ex
      return next
    })
  }

  const handleSave = () => {
    const entries: ExerciseEntry[] = levelExercises.map((ex, i) => {
      const state = exerciseState[i]
      const checkedCount = state.checkedSets.filter(Boolean).length

      let hitTarget = true
      for (let s = 0; s < state.checkedSets.length; s++) {
        if (!state.checkedSets[s]) continue
        if (ex.isHold) {
          if ((state.actualHoldSeconds?.[s] ?? 0) < (ex.targetHoldSeconds ?? 0)) hitTarget = false
        } else {
          if (state.actualReps[s] < ex.targetReps) hitTarget = false
        }
      }
      if (checkedCount < ex.targetSets) hitTarget = false

      return {
        exerciseId: ex.id,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        actualSets: checkedCount,
        actualReps: state.actualReps,
        actualHoldSeconds: state.actualHoldSeconds,
        checkedSets: state.checkedSets,
        hitTarget,
      }
    })

    const session: WorkoutSession = {
      id: `${category}-${level}-${Date.now()}`,
      date: new Date().toISOString(),
      level,
      category,
      exercises: entries,
      ...(notes.trim() && { notes: notes.trim() }),
    }

    onSave(session)
  }

  return (
    <div className="p-4 space-y-4">
      {levelExercises.map((ex, exIdx) => {
        const state = exerciseState[exIdx]
        const isHold = ex.isHold
        const lastEntry = lastSession?.exercises.find(e => e.exerciseId === ex.id)
        const checkedCount = state.checkedSets.filter(Boolean).length

        return (
          <div key={ex.id}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-sm font-semibold text-tron-text">{ex.name}</p>
              <p className="text-[11px] text-tron-muted font-mono">
                {ex.targetSets}&times;{isHold ? `${ex.targetHoldSeconds}s` : ex.targetReps}
              </p>
            </div>

            {/* Mini set progress */}
            <div className="flex items-center gap-2 mb-2">
              <ProgressBar
                value={ex.targetSets > 0 ? Math.round((checkedCount / ex.targetSets) * 100) : 0}
                color={checkedCount === ex.targetSets ? 'emerald' : 'muted'}
              />
              <span className="text-[10px] text-tron-muted font-mono whitespace-nowrap">
                {checkedCount}/{ex.targetSets} sets
              </span>
            </div>

            <div className="space-y-2">
              {Array.from({ length: ex.targetSets }).map((_, setIdx) => {
                const checked = state.checkedSets[setIdx]
                const actualValue = isHold
                  ? (state.actualHoldSeconds?.[setIdx] ?? 0)
                  : state.actualReps[setIdx]
                const targetValue = isHold ? (ex.targetHoldSeconds ?? 0) : ex.targetReps
                const met = actualValue >= targetValue
                const lastValue = isHold
                  ? lastEntry?.actualHoldSeconds?.[setIdx]
                  : lastEntry?.actualReps?.[setIdx]

                return (
                  <div key={setIdx}>
                    <div className="flex items-center gap-3">
                      <SetCheckbox
                        checked={checked}
                        met={met}
                        onChange={() => toggleSet(exIdx, setIdx)}
                      />
                      <span className="text-[11px] text-tron-muted font-mono w-8">
                        S{setIdx + 1}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`${ex.name} set ${setIdx + 1} ${isHold ? 'seconds' : 'reps'}`}
                        value={actualValue}
                        onChange={e => {
                          const v = Math.max(0, parseInt(e.target.value) || 0)
                          updateValue(exIdx, setIdx, v, isHold)
                        }}
                        className="w-16 rounded border border-tron-border bg-tron-bg px-2 py-1 text-center text-sm text-tron-text font-mono focus:border-tron-primary focus:outline-none"
                      />
                      <span className="text-[11px] text-tron-muted">
                        / {targetValue}{isHold ? 's' : ''}
                      </span>
                    </div>
                    {lastValue !== undefined && (
                      <p className="text-[10px] text-tron-muted/60 ml-[4.25rem] mt-0.5">
                        last: {lastValue}{isHold ? 's' : ''}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Notes */}
      <textarea
        aria-label="Session notes"
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-tron-border bg-tron-bg px-3 py-2 text-sm text-tron-text placeholder:text-tron-muted/50 focus:border-tron-primary focus:outline-none resize-none"
      />

      {/* Save error */}
      {saveError && (
        <p className="text-xs text-tron-danger text-center" role="alert">{saveError}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl border border-tron-primary/30 bg-tron-primary-dim py-3 text-center text-sm font-semibold text-tron-primary transition-all hover:bg-tron-primary/20 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Session'}
      </button>
    </div>
  )
}

// ── Inline Result ───────────────────────────────────────────

function InlineResult({
  result,
  onDone,
}: {
  result: LogSessionResult
  onDone: () => void
}) {
  const { sessionResult, gateProgress: gate } = result
  const pct = sessionResult.completionPct

  const message = pct === 100
    ? 'Perfect — clean session!'
    : pct >= 90
      ? 'Almost there — so close to a clean session.'
      : pct >= 75
        ? 'Solid work — a few more reps and you\'ve got it.'
        : pct >= 50
          ? 'Good effort — keep building.'
          : 'Every rep counts. Keep showing up.'

  return (
    <div className="p-4 space-y-4">
      {/* Header + completion */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold tracking-wider text-tron-primary">SESSION LOGGED</h2>
        <p className="text-3xl font-bold font-mono text-tron-text">{pct}%</p>
        <ProgressBar
          value={pct}
          color={pct === 100 ? 'emerald' : pct >= 75 ? 'cyan' : 'amber'}
        />
        <p className="text-xs text-tron-muted mt-2">{message}</p>
      </div>

      {/* Gate progress */}
      <div className="flex items-center justify-between rounded-lg bg-tron-bg p-3">
        <span className="text-[11px] text-tron-muted">
          {gate.status === 'passed'
            ? 'Gate cleared!'
            : `${gate.consecutivePasses}/3 clean sessions needed`}
        </span>
        {sessionResult.isClean && gate.status !== 'passed' && (
          <span className="text-[10px] text-tron-success">Clean ✓</span>
        )}
      </div>

      {/* Per-exercise breakdown */}
      {sessionResult.exerciseResults.length > 0 && (
        <div className="space-y-2">
          {sessionResult.exerciseResults.map(er => {
            const doneSets = er.actualCheckedSets
            const totalSets = er.targetSets
            const setsPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0
            const gapText = getGapText(er)

            return (
              <div key={er.exerciseId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-tron-text truncate">{er.exerciseId}</span>
                  <span className={cn(
                    'text-[10px] font-mono',
                    er.met ? 'text-tron-success' : 'text-tron-muted'
                  )}>
                    {er.met ? '✓' : `${setsPct}%`}
                  </span>
                </div>
                <ProgressBar
                  value={setsPct}
                  color={er.met ? 'emerald' : 'muted'}
                />
                {gapText && (
                  <p className="text-[10px] text-tron-muted mt-0.5">{gapText}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Done button */}
      <button
        onClick={onDone}
        className="w-full rounded-xl border border-tron-primary/30 bg-tron-primary-dim py-3 text-center text-sm font-semibold text-tron-primary transition-all hover:bg-tron-primary/20"
      >
        Done
      </button>
    </div>
  )
}

// ── Gap text helper ─────────────────────────────────────────

function getGapText(er: {
  met: boolean
  targetSets: number
  targetReps?: number
  targetHoldSeconds?: number
  actualCheckedSets: number
  actualReps: number[]
  actualHoldSeconds?: number[]
}): string | null {
  if (er.met) return null

  if (er.actualCheckedSets < er.targetSets) {
    const gap = er.targetSets - er.actualCheckedSets
    return `${gap} more set${gap > 1 ? 's' : ''} needed`
  }

  if (er.targetHoldSeconds && er.actualHoldSeconds) {
    const gaps = er.actualHoldSeconds
      .slice(0, er.actualCheckedSets)
      .map(h => Math.max(0, er.targetHoldSeconds! - h))
      .filter(g => g > 0)
    if (gaps.length > 0) return `${Math.max(...gaps)}s to go`
  }

  if (er.targetReps) {
    const gaps = er.actualReps
      .slice(0, er.actualCheckedSets)
      .map(r => Math.max(0, er.targetReps! - r))
      .filter(g => g > 0)
    if (gaps.length > 0) {
      const max = Math.max(...gaps)
      return `${max} rep${max > 1 ? 's' : ''} to go`
    }
  }

  return null
}
