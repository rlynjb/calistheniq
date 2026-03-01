'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { Category, Exercise, ExerciseEntry, ExerciseFormState, DraftSession, WorkoutSession } from '@/types'
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
import './home.css'

const typedExercises = exerciseData as Exercise[]

export default function HomePage() {
  const {
    status, user, categoryDoneThisWeek, weekComplete,
    completedThisWeek, streak, sessions, getGateForCategory, logSession,
    saveDraft, loadDraft,
  } = useGameState()

  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null)
  const [activeDraft, setActiveDraft] = useState<DraftSession | null>(null)
  const [result, setResult] = useState<LogSessionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [levelUpInfo, setLevelUpInfo] = useState<{
    category: Category; oldLevel: number; newLevel: number
  } | null>(null)
  const loadingCatRef = useRef<string | null>(null)

  if (status === 'loading') {
    return <div className="loading-state">Loading...</div>
  }

  if (status === 'error' || !user) {
    return (
      <div className="loading-state flex-col gap-3">
        <p>Failed to load data</p>
      </div>
    )
  }

  const handleToggleCategory = async (cat: Category) => {
    if (expandedCategory === cat) {
      setExpandedCategory(null)
      setActiveDraft(null)
      setResult(null)
      loadingCatRef.current = null
      return
    }
    if (categoryDoneThisWeek[cat]) return
    loadingCatRef.current = cat
    const draft = await loadDraft(cat, user.levels[cat])
    if (loadingCatRef.current !== cat) return
    setActiveDraft(draft)
    setExpandedCategory(cat)
    setResult(null)
    setSaving(false)
    setSaveError(null)
  }

  const handleSaveDraft = (draft: DraftSession) => {
    saveDraft(draft).catch(() => {})
  }

  const handleSave = async (session: WorkoutSession) => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await logSession(session)
      setActiveDraft(null)
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
    <div className="home-page">
      {/* Header: streak + week progress */}
      <div className="home-page__header">
        <div>
          <h1 className="home-page__title">This Week</h1>
          <p className="home-page__subtitle">
            {completedThisWeek}/3 sessions
          </p>
        </div>
        {streak > 0 && (
          <div className="streak-badge">
            <span className="streak-badge__count">{streak}</span>
            <span className="streak-badge__label">week streak</span>
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
          <p className="home-page__remaining">
            {remaining} session{remaining !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Category rows */}
      <div className="home-page__categories">
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
              className={cn('p-0', isDimmed && 'category-row--dimmed')}
            >
              {/* Tappable category header */}
              <div
                className={cn(
                  'category-row__header',
                  !isDimmed && 'category-row__header--clickable',
                )}
                onClick={() => { if (!isDimmed) handleToggleCategory(cat) }}
              >
                <div className="category-row__top">
                  <div className="category-row__info">
                    <CategoryBadge category={cat} />
                    <div>
                      <p className="category-row__level">
                        Level {level}
                        <span className="category-row__level-name">
                          {LEVEL_NAMES[level] ?? ''}
                        </span>
                      </p>
                      <p className="category-row__status">
                        {isDimmed
                          ? '✓ Done this week'
                          : isExpanded
                            ? (showResult ? 'Session logged' : 'Logging...')
                            : `${passes}/3 clean sessions · Tap to log`}
                      </p>
                    </div>
                  </div>
                  <div className="category-row__actions">
                    {isDimmed ? (
                      <span className="category-row__check">✓</span>
                    ) : (
                      <ChevronIcon expanded={isExpanded} />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: exercise form */}
              {isExpanded && !showResult && (
                <div className="category-row__divider">
                  <InlineExerciseForm
                    category={cat}
                    level={level}
                    sessions={sessions}
                    saving={saving}
                    saveError={saveError}
                    draft={activeDraft}
                    onSave={handleSave}
                    onSaveDraft={handleSaveDraft}
                  />
                </div>
              )}

              {/* Expanded: inline result */}
              {isExpanded && showResult && result && (
                <div className="category-row__divider">
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
        <div className="home-page__week-banner">
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
        'chevron-icon',
        expanded && 'chevron-icon--expanded'
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
  draft,
  onSave,
  onSaveDraft,
}: {
  category: Category
  level: number
  sessions: WorkoutSession[]
  saving: boolean
  saveError: string | null
  draft: DraftSession | null
  onSave: (session: WorkoutSession) => void
  onSaveDraft: (draft: DraftSession) => void
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

  // Restore from draft if exercise IDs still match current library
  const validDraft = draft &&
    draft.exercises.length === levelExercises.length &&
    draft.exercises.every((d, i) => d.exerciseId === levelExercises[i].id)
    ? draft : null

  const [exerciseState, setExerciseState] = useState<ExerciseFormState[]>(() => {
    if (validDraft) return validDraft.exercises
    return levelExercises.map(ex => {
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
  })

  const [notes, setNotes] = useState(validDraft?.notes ?? '')

  // ── Auto-save draft to blob storage on every interaction ──
  const isFirstRender = useRef(true)
  const saveDraftRef = useRef(onSaveDraft)
  saveDraftRef.current = onSaveDraft

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      saveDraftRef.current({
        category,
        level,
        exercises: exerciseState,
        notes,
        savedAt: new Date().toISOString(),
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [exerciseState, notes, category, level])

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
    <div className="exercise-form">
      {levelExercises.map((ex, exIdx) => {
        const state = exerciseState[exIdx]
        const isHold = ex.isHold
        const lastEntry = lastSession?.exercises.find(e => e.exerciseId === ex.id)
        const checkedCount = state.checkedSets.filter(Boolean).length

        return (
          <div key={ex.id}>
            <div className="exercise-form__ex-header">
              <p className="exercise-form__ex-name">{ex.name}</p>
              <p className="exercise-form__ex-target">
                {ex.targetSets}&times;{isHold ? `${ex.targetHoldSeconds}s` : ex.targetReps}
              </p>
            </div>

            {/* Mini set progress */}
            <div className="exercise-form__sets-progress">
              <ProgressBar
                value={ex.targetSets > 0 ? Math.round((checkedCount / ex.targetSets) * 100) : 0}
                color={checkedCount === ex.targetSets ? 'emerald' : 'muted'}
              />
              <span className="exercise-form__sets-count">
                {checkedCount}/{ex.targetSets} sets
              </span>
            </div>

            <div className="exercise-form__sets">
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
                    <div className="exercise-form__set-row">
                      <SetCheckbox
                        checked={checked}
                        met={met}
                        onChange={() => toggleSet(exIdx, setIdx)}
                      />
                      <span className="exercise-form__set-label">
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
                        className="exercise-form__set-input"
                      />
                      <span className="exercise-form__set-target">
                        / {targetValue}{isHold ? 's' : ''}
                      </span>
                    </div>
                    {lastValue !== undefined && (
                      <p className="exercise-form__last-value">
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
        className="exercise-form__notes"
      />

      {/* Save error */}
      {saveError && (
        <p className="exercise-form__error" role="alert">{saveError}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
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
