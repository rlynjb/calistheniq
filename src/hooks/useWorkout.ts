'use client'

import { useState, useCallback } from 'react'

export interface Exercise {
  name: string
  sets: number
  reps: string
  duration?: string
  notes?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface WorkoutPlan {
  id: string
  title: string
  description: string
  duration: number
  exercises: Exercise[]
  difficulty: string
  type: 'warmup' | 'strength' | 'cooldown'
  equipment: string[]
  created: Date
}

export interface WorkoutSession {
  id: string
  planId: string
  startTime: Date
  endTime?: Date
  completedExercises: string[]
  currentExercise?: string
  notes: string[]
  xpEarned?: number
  streak?: number
}

export function useWorkout() {
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null)
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWorkoutFromChatResponse = useCallback((chatResponse: any) => {
    if (!chatResponse.context?.workoutPlan) return null

    const plan = chatResponse.context.workoutPlan
    const workoutPlan: WorkoutPlan = {
      id: `workout_${Date.now()}`,
      title: plan.title || 'Custom Workout',
      description: plan.description || 'AI-generated workout plan',
      duration: plan.duration || 20,
      difficulty: plan.difficulty || 'beginner',
      type: 'strength',
      equipment: plan.equipment || ['bodyweight'],
      exercises: (plan.exercises || []).map((exercise: any, index: number) => ({
        name: typeof exercise === 'string' ? exercise : exercise.name || `Exercise ${index + 1}`,
        sets: exercise.sets || 3,
        reps: exercise.reps || '8-12',
        duration: exercise.duration,
        notes: exercise.notes,
        difficulty: exercise.difficulty || plan.difficulty || 'beginner'
      })),
      created: new Date()
    }

    setCurrentPlan(workoutPlan)
    return workoutPlan
  }, [])

  const startWorkoutSession = useCallback((planId: string) => {
    if (!currentPlan || currentPlan.id !== planId) return null

    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      planId,
      startTime: new Date(),
      completedExercises: [],
      notes: []
    }

    setCurrentSession(session)
    return session
  }, [currentPlan])

  const completeExercise = useCallback((exerciseName: string, notes?: string) => {
    if (!currentSession) return

    setCurrentSession(prev => {
      if (!prev) return null

      const updated = {
        ...prev,
        completedExercises: [...prev.completedExercises, exerciseName],
        notes: notes ? [...prev.notes, `${exerciseName}: ${notes}`] : prev.notes
      }

      return updated
    })
  }, [currentSession])

  const finishWorkoutSession = useCallback((xpEarned?: number, streak?: number) => {
    if (!currentSession) return null

    const finishedSession = {
      ...currentSession,
      endTime: new Date(),
      xpEarned,
      streak
    }

    setCurrentSession(finishedSession)
    return finishedSession
  }, [currentSession])

  const clearWorkout = useCallback(() => {
    setCurrentPlan(null)
    setCurrentSession(null)
    setError(null)
  }, [])

  const getWorkoutProgress = useCallback(() => {
    if (!currentPlan || !currentSession) return { completed: 0, total: 0, percentage: 0 }

    const completed = currentSession.completedExercises.length
    const total = currentPlan.exercises.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
  }, [currentPlan, currentSession])

  const getCurrentExercise = useCallback(() => {
    if (!currentPlan || !currentSession) return null

    const completedCount = currentSession.completedExercises.length
    if (completedCount >= currentPlan.exercises.length) return null

    return currentPlan.exercises[completedCount]
  }, [currentPlan, currentSession])

  const isWorkoutComplete = useCallback(() => {
    if (!currentPlan || !currentSession) return false
    return currentSession.completedExercises.length >= currentPlan.exercises.length
  }, [currentPlan, currentSession])

  return {
    currentPlan,
    currentSession,
    isLoading,
    error,
    createWorkoutFromChatResponse,
    startWorkoutSession,
    completeExercise,
    finishWorkoutSession,
    clearWorkout,
    getWorkoutProgress,
    getCurrentExercise,
    isWorkoutComplete
  }
}
