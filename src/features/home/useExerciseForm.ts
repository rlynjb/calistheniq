/**
 * @file Exercise form state management hook — handles set tracking,
 * rep/hold input, draft restoration, and auto-save persistence.
 *
 * @description
 * Colocated with its sole consumer ({@link ExerciseForm}). Manages
 * the mutable form state for logging a workout session: which sets
 * are checked, actual reps/holds entered, and session notes. Auto-saves
 * a draft to blob storage on a 500ms debounce so the user can leave
 * mid-session and resume later.
 *
 * @example
 * const { levelExercises, exerciseState, toggleSet, buildSession } =
 *   useExerciseForm({ category: 'push', level: 2, sessions, draft, onSaveDraft })
 *
 * @see {@link ExerciseForm} for the UI that consumes this hook
 * @see {@link DraftSession} for the persisted draft shape
 */
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type {
  Category,
  Exercise,
  ExerciseEntry,
  ExerciseFormState,
  DraftSession,
  WorkoutSession,
} from '@/types'
import exerciseData from '@/data/exercises.json'

const typedExercises = exerciseData as Exercise[]

interface UseExerciseFormOptions {
  /** The training discipline being logged. */
  category: Category

  /** The user's current level in this category (1–5). */
  level: number

  /** All previously logged sessions — used to find the last session for pre-filling values. */
  sessions: WorkoutSession[]

  /**
   * A previously saved draft for this category/level, or null.
   * When provided and exercise IDs still match the current library,
   * the form is restored from this draft instead of defaults.
   */
  draft: DraftSession | null

  /**
   * Callback to persist the current form state as a draft.
   * Called on a 500ms debounce after any form interaction.
   */
  onSaveDraft: (draft: DraftSession) => void
}

/**
 * Manages exercise form state for a single category/level workout session.
 *
 * @description
 * On initialization:
 * 1. If a valid draft exists (exercise IDs match current library), restores from it.
 * 2. Otherwise, pre-fills rep/hold values from the user's last session at this level.
 * 3. If no last session exists, defaults to target values from the exercise library.
 *
 * All form mutations (toggleSet, updateValue, setNotes) trigger a debounced
 * auto-save to blob storage via `onSaveDraft`. The first render is skipped
 * to avoid saving the initial state as a "change".
 *
 * @returns Object containing:
 * - `levelExercises` — filtered exercise definitions for this category/level
 * - `lastSession` — the user's most recent session at this level, or null
 * - `exerciseState` — mutable per-exercise form state array
 * - `notes` / `setNotes` — session notes state
 * - `toggleSet(exIdx, setIdx)` — marks/unmarks a set as completed
 * - `updateValue(exIdx, setIdx, value, isHold)` — updates reps or hold seconds
 * - `buildSession()` — assembles the current form state into a WorkoutSession
 *
 * @example
 * const { toggleSet, buildSession } = useExerciseForm(options)
 *
 * // User checks set 2 of exercise 0
 * toggleSet(0, 1)
 *
 * // User clicks save
 * const session = buildSession()
 * await logSession(session)
 */
export function useExerciseForm({
  category,
  level,
  sessions,
  draft,
  onSaveDraft,
}: UseExerciseFormOptions) {
  const levelExercises = useMemo(
    () => typedExercises.filter(e => e.category === category && e.level === level),
    [category, level]
  )

  const lastSession = useMemo(() => {
    return sessions
      .filter(s => s.category === category && s.level === level)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
  }, [sessions, category, level])

  // Restore from draft only if exercise IDs still match the current library.
  // A library update (exercises added/removed/reordered) invalidates old drafts.
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

  // Auto-save draft to blob storage on every interaction (500ms debounce).
  // Uses a ref for onSaveDraft to avoid re-running the effect when the
  // callback identity changes (it's recreated on every parent render).
  const isFirstRender = useRef(true)
  const saveDraftRef = useRef(onSaveDraft)
  saveDraftRef.current = onSaveDraft

  useEffect(() => {
    // Skip the first render — the initial state isn't a user "change"
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

  /** Toggles a set's checked state (completed/not completed). */
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

  /** Updates the reps or hold seconds for a specific set. */
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

  /**
   * Assembles the current form state into a complete WorkoutSession.
   * Computes `hitTarget` per exercise by checking whether all checked sets
   * met or exceeded their targets, and whether enough sets were completed.
   */
  const buildSession = (): WorkoutSession => {
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

    return {
      id: `${category}-${level}-${Date.now()}`,
      date: new Date().toISOString(),
      level,
      category,
      exercises: entries,
      ...(notes.trim() && { notes: notes.trim() }),
    }
  }

  return {
    levelExercises,
    lastSession,
    exerciseState,
    notes,
    setNotes,
    toggleSet,
    updateValue,
    buildSession,
  }
}
