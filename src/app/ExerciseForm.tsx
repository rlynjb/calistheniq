'use client'

import { SetCheckbox } from '@/components/ui/SetCheckbox'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useExerciseForm } from '@/hooks/useExerciseForm'
import type { Category, DraftSession, WorkoutSession } from '@/types'

interface ExerciseFormProps {
  category: Category
  level: number
  sessions: WorkoutSession[]
  saving: boolean
  saveError: string | null
  draft: DraftSession | null
  onSave: (session: WorkoutSession) => void
  onSaveDraft: (draft: DraftSession) => void
}

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
