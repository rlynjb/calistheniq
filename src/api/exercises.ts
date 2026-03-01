/**
 * Exercise API
 */

// Types
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

