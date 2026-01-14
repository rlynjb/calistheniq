// Re-export commonly used types
export type { Metadata } from 'next'

// Base exercise set structure - can be extended for specific use cases
export interface BaseExerciseSet {
  reps?: number
  duration?: number
}

// Exercise set for workout progress tracking (extends base with completion status)
export interface CompletedSet extends BaseExerciseSet {
  tempo: string
  rest: number
  completed: boolean
}

// Exercise set for planned workouts (extends base with timing info)
export interface TargetSet extends BaseExerciseSet {
  tempo: string
  rest: number
}

// Exercise set for workout levels (simple structure)
export interface ExerciseSet extends BaseExerciseSet {}

// Base exercise structure
export interface BaseExercise {
  name: string
}

// Exercise for completed workouts
export interface CompletedExercise extends BaseExercise {
  sets: CompletedSet[]
}

// Exercise for planned workouts  
export interface PlannedExercise extends BaseExercise {
  targetSets: TargetSet[]
  progression: string
}

// Exercise for workout levels
export interface Exercise extends BaseExercise {
  sets: ExerciseSet[]
  tempo: string
  rest: number
  equipment?: string
  notes?: string
}

// Workout structures
export interface CompletedWorkout {
  date: Date
  duration: number
  exercises: CompletedExercise[]
}

export interface PlannedWorkout {
  exercises: PlannedExercise[]
}

// Workout levels structures
export interface ExercisesByCategory {
  Push: Exercise[]
  Pull: Exercise[]
  Squat: Exercise[]
}

export interface WorkoutLevel {
  name: string
  description?: string
  exercises: ExercisesByCategory
}

export type WorkoutLevels = Record<string, WorkoutLevel>

// User progress tracking types
export interface CurrentUserLevels {
  Push: number
  Pull: number
  Squat: number
}

export type MovementCategory = keyof CurrentUserLevels

// Weekly progress tracking types
export interface WeekDay {
  date: Date
  day: string
  dayNum: number
  completed: boolean
  isToday: boolean
}

// Chat system types (exported from useChat for reuse)
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  agent?: string
  sessionState?: string
}

export interface ChatResponse {
  message: string
  sessionId: string
  sessionState: string
  currentAgent: string
  data?: any
  context?: any
  processingTimeMs?: number
}

// Exercise pattern types (matching constants.ts)
export type ExercisePattern = 'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'mobility'
export type EquipmentType = 'bodyweight' | 'trx' | 'band' | 'household'

// Pain scale type (0-10 scale)
export type PainScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// TODO: Add more shared types as they are identified in components and hooks
