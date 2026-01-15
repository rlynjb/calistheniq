// Re-export commonly used types
export type { Metadata } from 'next'

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

// Workout levels structures
export interface ExercisesByCategory {
  Push: BaseExercise[]
  Pull: BaseExercise[]
  Squat: BaseExercise[]
}

export interface WorkoutLevel {
  name: string
  description?: string
  exercises: ExercisesByCategory
}

export type WorkoutLevels = Record<string, WorkoutLevel>

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
