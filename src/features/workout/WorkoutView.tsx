'use client'

import { useState, useRef, useCallback } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { Category } from '@/types'
import type { LogSessionResult } from '@/hooks/useGameState'
import type { Landmark } from '@/lib/pose/landmarks'
import { createPushupProcessor } from '@/lib/pose/exercises/pushup'
import { createSquatProcessor } from '@/lib/pose/exercises/squat'
import { createPlankProcessor } from '@/lib/pose/exercises/plank'
import { GatePassedModal } from '@/components/GatePassedModal'
import { ExerciseSelector } from './ExerciseSelector'
import { CameraView } from './CameraView'
import { WorkoutHUD } from './WorkoutHUD'
import { WorkoutResult } from './WorkoutResult'
import { useWorkoutSession } from './useWorkoutSession'
import './workout.css'

type ExerciseProcessor = ReturnType<typeof createPushupProcessor>
  | ReturnType<typeof createSquatProcessor>
type PlankProcessorType = ReturnType<typeof createPlankProcessor>

export function WorkoutView() {
  const {
    status, user, categoryDoneThisWeek, logSession,
  } = useGameState()

  const workoutSession = useWorkoutSession({
    userLevels: user?.levels ?? { push: 1, pull: 1, squat: 1 },
  })

  const [result, setResult] = useState<LogSessionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [levelUpInfo, setLevelUpInfo] = useState<{
    category: Category; oldLevel: number; newLevel: number
  } | null>(null)

  // Processor refs — created when workout starts, reset between exercises
  const repProcessorRef = useRef<ExerciseProcessor | null>(null)
  const plankProcessorRef = useRef<PlankProcessorType | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  const currentExercise = workoutSession.exercises[workoutSession.currentExerciseIndex]
  const isHold = currentExercise?.isHold ?? false

  // Create/reset processor when exercise changes
  const ensureProcessor = useCallback((cat: Category) => {
    if (isHold) {
      if (!plankProcessorRef.current) {
        plankProcessorRef.current = createPlankProcessor()
      }
      repProcessorRef.current = null
    } else {
      if (cat === 'squat') {
        repProcessorRef.current = createSquatProcessor()
      } else {
        repProcessorRef.current = createPushupProcessor()
      }
      plankProcessorRef.current = null
    }
    lastFrameTimeRef.current = 0
  }, [isHold])

  const handleSelectCategory = useCallback((cat: Category) => {
    workoutSession.selectCategory(cat)
    workoutSession.startWorkout()
    ensureProcessor(cat)
  }, [workoutSession, ensureProcessor])

  const handleLandmarks = useCallback((landmarks: Landmark[]) => {
    if (!currentExercise) return

    const now = performance.now()

    if (isHold && plankProcessorRef.current) {
      const deltaMs = lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 0
      lastFrameTimeRef.current = now

      const plankResult = plankProcessorRef.current.processFrame(landmarks, deltaMs)
      workoutSession.recordHoldTime(plankResult.holdTimeMs)
    } else if (repProcessorRef.current) {
      const frameResult = repProcessorRef.current.processFrame(landmarks)
      if (frameResult.repCompleted) {
        workoutSession.recordRep()
      }
    }
  }, [currentExercise, isHold, workoutSession])

  const handleNextSet = useCallback(() => {
    workoutSession.nextSet()
    // Reset processor for next set
    repProcessorRef.current?.reset()
    plankProcessorRef.current?.reset()
    lastFrameTimeRef.current = 0
  }, [workoutSession])

  const handleNextExercise = useCallback(() => {
    workoutSession.nextExercise()
    // Processor will be recreated for next exercise type
    repProcessorRef.current = null
    plankProcessorRef.current = null
    lastFrameTimeRef.current = 0

    // Need to create a new processor for the next exercise
    const nextIdx = workoutSession.currentExerciseIndex + 1
    const nextEx = workoutSession.exercises[nextIdx]
    if (nextEx && workoutSession.selectedCategory) {
      if (nextEx.isHold) {
        plankProcessorRef.current = createPlankProcessor()
      } else if (workoutSession.selectedCategory === 'squat') {
        repProcessorRef.current = createSquatProcessor()
      } else {
        repProcessorRef.current = createPushupProcessor()
      }
    }
  }, [workoutSession])

  const handleFinish = useCallback(async () => {
    setSaving(true)
    try {
      const session = workoutSession.buildSession()
      const res = await logSession(session)
      setResult(res)
      workoutSession.finishWorkout()

      if (res.leveledUp && res.newLevel) {
        setLevelUpInfo({
          category: session.category,
          oldLevel: session.level,
          newLevel: res.newLevel,
        })
      }
    } catch {
      // If save fails, still show result phase
      workoutSession.finishWorkout()
    } finally {
      setSaving(false)
    }
  }, [workoutSession, logSession])

  const handleDone = useCallback(() => {
    workoutSession.reset()
    setResult(null)
    repProcessorRef.current = null
    plankProcessorRef.current = null
  }, [workoutSession])

  if (status === 'loading') {
    return <div className="loading-state">Loading...</div>
  }

  if (!user) {
    return <div className="loading-state">No data</div>
  }

  return (
    <div className="workout-view">
      {/* Phase: Select category */}
      {workoutSession.phase === 'select' && (
        <ExerciseSelector
          userLevels={user.levels}
          categoryDoneThisWeek={categoryDoneThisWeek}
          onSelect={handleSelectCategory}
        />
      )}

      {/* Phase: Active workout */}
      {workoutSession.phase === 'workout' && currentExercise && workoutSession.selectedCategory && (
        <CameraView onLandmarks={handleLandmarks}>
          <WorkoutHUD
            category={workoutSession.selectedCategory}
            level={user.levels[workoutSession.selectedCategory]}
            exercise={currentExercise}
            currentSet={workoutSession.currentSet}
            repCount={
              workoutSession.repCounts[workoutSession.currentExerciseIndex]?.[workoutSession.currentSet] ?? 0
            }
            holdTimeMs={
              workoutSession.holdTimes[workoutSession.currentExerciseIndex]?.[workoutSession.currentSet] ?? 0
            }
            isHolding={plankProcessorRef.current?.holding ?? false}
            isLastSet={workoutSession.currentSet >= currentExercise.targetSets - 1}
            isLastExercise={workoutSession.currentExerciseIndex >= workoutSession.exercises.length - 1}
            onNextSet={handleNextSet}
            onNextExercise={handleNextExercise}
            onFinish={handleFinish}
          />
        </CameraView>
      )}

      {/* Phase: Result */}
      {workoutSession.phase === 'result' && result && (
        <WorkoutResult
          result={result}
          exercises={workoutSession.exercises}
          repCounts={workoutSession.repCounts}
          holdTimes={workoutSession.holdTimes}
          onDone={handleDone}
        />
      )}

      {/* Saving overlay */}
      {saving && (
        <div className="loading-state" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}>
          Saving session...
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
