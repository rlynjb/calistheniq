/**
 * Types specific to WorkoutLevels mock data
 */

// Base exercise set structure - can be extended for specific use cases
export interface BaseExerciseSet {
  reps?: number
  duration?: number
}

// Base exercise structure
export interface BaseExercise {
  name: string
  tempo?: string
  rest?: number
  equipment?: string
  notes?: string
  sets: BaseExerciseSet[]
}

// Exercise with additional metadata for organization
export interface ExerciseWithMetadata extends BaseExercise {
  id: string
  level: number
  levelName: string
  category: 'Push' | 'Pull' | 'Squat'
  difficulty: 'Foundation' | 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Expert'
  tags: string[]
}

// Exercises organized by movement category
export interface ExercisesByCategory {
  Push: BaseExercise[]
  Pull: BaseExercise[]
  Squat: BaseExercise[]
}

// Structure for a single workout level
export interface WorkoutLevel {
  name: string
  description?: string
  exercises: ExercisesByCategory
}

// Collection of all workout levels
export type WorkoutLevels = Record<string, WorkoutLevel>
