/**
 * Legacy API Types
 *
 * These types originate from the old exercise/user REST endpoints (now removed).
 * They're still used by mock data (seed scripts, MSW handlers).
 *
 * The active app uses types from ./index.ts instead.
 */

// ── Exercise types ──────────────────────────────────────────

export interface BaseExerciseSet {
  reps?: number
  duration?: number
}

export interface BaseExercise {
  name: string
  tempo?: string
  rest?: number
  equipment?: string
  notes?: string
  sets: BaseExerciseSet[]
  completed?: boolean
  completedSets?: boolean[]
  category: 'Push' | 'Pull' | 'Squat'
}

export interface ExerciseWithMetadata extends BaseExercise {
  id: string
  level: number
  levelName: string
  category: 'Push' | 'Pull' | 'Squat'
  difficulty: 'Foundation' | 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Expert'
  tags: string[]
}

export interface ExercisesByCategory {
  Push: BaseExercise[]
  Pull: BaseExercise[]
  Squat: BaseExercise[]
}

export interface ProgressionNotes {
  Push?: string
  Pull?: string
  Squat?: string
}

export interface WorkoutLevel {
  name: string
  description?: string
  exercises: ExercisesByCategory
  progressionNotes?: ProgressionNotes
}

export type WorkoutLevels = Record<string, WorkoutLevel>

export interface ExerciseLevelInfo {
  level: number
  name: string
  category: string
  originalSets?: BaseExerciseSet[]
}

// ── User types ──────────────────────────────────────────────

export interface CurrentUserLevels {
  Push: number
  Pull: number
  Squat: number
}

export type MovementCategory = keyof CurrentUserLevels

export interface LegacyWorkoutSession {
  exercises: BaseExercise[]
  categories: ('Push' | 'Pull' | 'Squat')[]
  level: number
  date: Date | string
}

export interface WeekDay {
  date: Date
  completed: boolean
  isToday: boolean
  completedWorkout?: LegacyWorkoutSession
  todayWorkout?: LegacyWorkoutSession
  isWorkoutDay?: boolean
}

export interface UserData {
  currentLevels: CurrentUserLevels
  lastUpdated: string
  weeklyProgress?: LegacyWorkoutSession[]
}
