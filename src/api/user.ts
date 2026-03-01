/**
 * User API
 */

import type { BaseExercise } from './exercises'

// Types
export interface CurrentUserLevels {
  Push: number
  Pull: number
  Squat: number
}

export type MovementCategory = keyof CurrentUserLevels

export interface WorkoutSession {
  exercises: BaseExercise[]
  categories: ('Push' | 'Pull' | 'Squat')[]
  level: number
  date: Date | string
}

export interface WeekDay {
  date: Date
  completed: boolean
  isToday: boolean
  completedWorkout?: WorkoutSession
  todayWorkout?: WorkoutSession
  isWorkoutDay?: boolean
}

export interface UserData {
  currentLevels: CurrentUserLevels
  lastUpdated: string
  weeklyProgress?: WorkoutSession[]
}

