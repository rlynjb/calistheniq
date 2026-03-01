'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Category, Exercise, ExerciseEntry, WorkoutSession } from '@/types'
import exerciseData from '@/data/exercises.json'

const typedExercises = exerciseData as Exercise[]

export type WorkoutPhase = 'select' | 'workout' | 'result'

interface UseWorkoutSessionOptions {
  /** User's current levels per category. */
  userLevels: Record<Category, number>
}

export interface UseWorkoutSessionReturn {
  phase: WorkoutPhase
  selectedCategory: Category | null
  currentExerciseIndex: number
  currentSet: number
  exercises: Exercise[]
  /** Reps counted per set per exercise: repCounts[exerciseIdx][setIdx]. */
  repCounts: number[][]
  /** Hold times in ms per set per exercise (plank exercises). */
  holdTimes: number[][]

  selectCategory: (cat: Category) => void
  startWorkout: () => void
  recordRep: () => void
  recordHoldTime: (ms: number) => void
  nextSet: () => void
  nextExercise: () => void
  finishWorkout: () => void
  buildSession: () => WorkoutSession
  reset: () => void
}

export function useWorkoutSession({ userLevels }: UseWorkoutSessionOptions): UseWorkoutSessionReturn {
  const [phase, setPhase] = useState<WorkoutPhase>('select')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)
  const [repCounts, setRepCounts] = useState<number[][]>([])
  const [holdTimes, setHoldTimes] = useState<number[][]>([])

  const level = selectedCategory ? userLevels[selectedCategory] : 1

  const exercises = useMemo(
    () => selectedCategory
      ? typedExercises.filter(e => e.category === selectedCategory && e.level === level)
      : [],
    [selectedCategory, level]
  )

  const selectCategory = useCallback((cat: Category) => {
    setSelectedCategory(cat)
  }, [])

  const startWorkout = useCallback(() => {
    if (!exercises.length) return
    // Initialize tracking arrays
    const reps = exercises.map(ex => Array(ex.targetSets).fill(0) as number[])
    const holds = exercises.map(ex => Array(ex.targetSets).fill(0) as number[])
    setRepCounts(reps)
    setHoldTimes(holds)
    setCurrentExerciseIndex(0)
    setCurrentSet(0)
    setPhase('workout')
  }, [exercises])

  const recordRep = useCallback(() => {
    setRepCounts(prev => {
      const next = prev.map(arr => [...arr])
      if (next[currentExerciseIndex]) {
        next[currentExerciseIndex][currentSet]++
      }
      return next
    })
  }, [currentExerciseIndex, currentSet])

  const recordHoldTime = useCallback((ms: number) => {
    setHoldTimes(prev => {
      const next = prev.map(arr => [...arr])
      if (next[currentExerciseIndex]) {
        next[currentExerciseIndex][currentSet] = ms
      }
      return next
    })
  }, [currentExerciseIndex, currentSet])

  const nextSet = useCallback(() => {
    const ex = exercises[currentExerciseIndex]
    if (!ex) return
    if (currentSet < ex.targetSets - 1) {
      setCurrentSet(prev => prev + 1)
    }
  }, [exercises, currentExerciseIndex, currentSet])

  const nextExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSet(0)
    }
  }, [exercises.length, currentExerciseIndex])

  const finishWorkout = useCallback(() => {
    setPhase('result')
  }, [])

  const buildSession = useCallback((): WorkoutSession => {
    const cat = selectedCategory!
    const entries: ExerciseEntry[] = exercises.map((ex, exIdx) => {
      const reps = repCounts[exIdx] ?? []
      const holds = holdTimes[exIdx] ?? []

      // Determine how many sets were actually completed
      const checkedSets = Array(ex.targetSets).fill(false).map((_, setIdx) => {
        if (ex.isHold) {
          return Math.round((holds[setIdx] ?? 0) / 1000) > 0
        }
        return (reps[setIdx] ?? 0) > 0
      })
      const actualSets = checkedSets.filter(Boolean).length

      // Compute hitTarget — same logic as useExerciseForm.buildSession()
      let hitTarget = true
      for (let s = 0; s < checkedSets.length; s++) {
        if (!checkedSets[s]) continue
        if (ex.isHold) {
          if (Math.round((holds[s] ?? 0) / 1000) < (ex.targetHoldSeconds ?? 0)) hitTarget = false
        } else {
          if ((reps[s] ?? 0) < ex.targetReps) hitTarget = false
        }
      }
      if (actualSets < ex.targetSets) hitTarget = false

      return {
        exerciseId: ex.id,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        actualSets,
        actualReps: reps,
        actualHoldSeconds: ex.isHold
          ? holds.map(ms => Math.round(ms / 1000))
          : undefined,
        checkedSets,
        hitTarget,
      }
    })

    return {
      id: `${cat}-${level}-${Date.now()}`,
      date: new Date().toISOString(),
      level,
      category: cat,
      exercises: entries,
    }
  }, [selectedCategory, level, exercises, repCounts, holdTimes])

  const reset = useCallback(() => {
    setPhase('select')
    setSelectedCategory(null)
    setCurrentExerciseIndex(0)
    setCurrentSet(0)
    setRepCounts([])
    setHoldTimes([])
  }, [])

  return {
    phase,
    selectedCategory,
    currentExerciseIndex,
    currentSet,
    exercises,
    repCounts,
    holdTimes,
    selectCategory,
    startWorkout,
    recordRep,
    recordHoldTime,
    nextSet,
    nextExercise,
    finishWorkout,
    buildSession,
    reset,
  }
}
