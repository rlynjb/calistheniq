/**
 * @file Workout logging form — renders set checkboxes, rep/hold inputs,
 * and a save button for a single category at the user's current level.
 *
 * @description
 * Displays all exercises for the given category/level with per-set
 * tracking. Each set has a checkbox, a numeric input (reps or seconds),
 * and the target value. Previous session values are shown below each
 * set for reference. Form state is managed by {@link useExerciseForm}
 * and auto-saved as a draft on every interaction.
 *
 * @example
 * <ExerciseForm
 *   category="push"
 *   level={2}
 *   sessions={sessions}
 *   saving={false}
 *   saveError={null}
 *   draft={loadedDraft}
 *   onSave={handleSave}
 *   onSaveDraft={handleSaveDraft}
 * />
 *
 * @see {@link useExerciseForm} for form state management and draft auto-saving
 * @see {@link HomeView} for the parent that controls expansion and saving
 */
'use client'

import { useState } from 'react'
import { SetCheckbox } from '@/components/ui/SetCheckbox'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SetCameraOverlay } from './SetCameraOverlay'
import { useExerciseForm } from './useExerciseForm'
import type { Category, DraftSession, WorkoutSession } from '@/types'

interface ExerciseFormProps {
  /** The training discipline being logged. */
  category: Category

  /** The user's current level in this category (1–5). */
  level: number

  /** All previously logged sessions — passed to useExerciseForm for last-session lookup. */
  sessions: WorkoutSession[]

  /** Whether a save operation is currently in flight. Disables the save button. */
  saving: boolean

  /** Error message from a failed save attempt, or null. Displayed above the save button. */
  saveError: string | null

  /**
   * A previously saved draft to restore from, or null.
   * Passed to useExerciseForm for form state initialization.
   */
  draft: DraftSession | null

  /** Callback fired when the user taps "Save Session". Receives a fully assembled WorkoutSession. */
  onSave: (session: WorkoutSession) => void

  /** Callback for persisting draft state. Called by useExerciseForm on a 500ms debounce. */
  onSaveDraft: (draft: DraftSession) => void
}

/**
 * Renders the per-set workout logging form for a single category/level.
 *
 * @description
 * Each exercise shows its name, target (e.g., "3x10"), a mini progress
 * bar, and per-set rows with checkbox + numeric input. Checked sets
 * are evaluated against the target to determine `hitTarget` when
 * the session is saved. The form also shows "last: X" hints when
 * a previous session exists for the same exercise.
 */
export function ExerciseForm({
  category,
  level,
  sessions,
  saving,
  saveError,
  draft,
  onSave,
  onSaveDraft,
}: ExerciseFormProps) {
  const {
    levelExercises,
    lastSession,
    exerciseState,
    notes,
    setNotes,
    toggleSet,
    updateValue,
    buildSession,
  } = useExerciseForm({ category, level, sessions, draft, onSaveDraft })

  const handleSave = () => {
    onSave(buildSession())
  }

  const [cameraTarget, setCameraTarget] = useState<{
    exIdx: number; setIdx: number
  } | null>(null)

  const handleCameraClick = (exIdx: number) => {
    const state = exerciseState[exIdx]
    const firstUnchecked = state.checkedSets.findIndex(checked => !checked)
    if (firstUnchecked === -1) return
    setCameraTarget({ exIdx, setIdx: firstUnchecked })
  }

  const handleCameraComplete = (value: number) => {
    if (!cameraTarget) return
    const { exIdx, setIdx } = cameraTarget
    const ex = levelExercises[exIdx]
    updateValue(exIdx, setIdx, value, ex.isHold)
    toggleSet(exIdx, setIdx)
    setCameraTarget(null)
  }

  const handleCameraClose = () => {
    setCameraTarget(null)
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

            <div className="exercise-form__sets-layout">
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
                          value={actualValue || ''}
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
              <button
                type="button"
                className="exercise-form__camera-btn"
                aria-label={`Use camera for ${ex.name}`}
                onClick={() => handleCameraClick(exIdx)}
                disabled={state.checkedSets.every(Boolean)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
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

      {/* Camera overlay */}
      {cameraTarget && (
        <SetCameraOverlay
          category={category}
          exercise={levelExercises[cameraTarget.exIdx]}
          setIndex={cameraTarget.setIdx}
          targetValue={
            levelExercises[cameraTarget.exIdx].isHold
              ? (levelExercises[cameraTarget.exIdx].targetHoldSeconds ?? 0)
              : levelExercises[cameraTarget.exIdx].targetReps
          }
          onComplete={handleCameraComplete}
          onClose={handleCameraClose}
        />
      )}
    </div>
  )
}
