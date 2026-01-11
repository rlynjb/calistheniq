// Re-export commonly used types
export type { Metadata } from 'next'

// User Profile Types
export interface UserProfile {
  id: string
  level: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  timeAvailable: number // minutes
  equipment: string[]
  constraints: {
    injuries?: string[]
    painAreas?: string[]
    limitations?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

// Session Types
export interface WorkoutSession {
  id: string
  userId: string
  planJson: WorkoutPlan
  completedAt?: Date
  xpAwarded: number
  createdAt: Date
}

// Workout Plan Types
export interface WorkoutPlan {
  timeMinutes: number
  theme: string
  warmup: Exercise[]
  main: WorkoutBlock[]
  finisher: Exercise[]
  cooldown: Exercise[]
  regressions: Record<string, string[]>
  progressionRule: string
}

export interface WorkoutBlock {
  block: string
  type: 'circuit' | 'straight_sets' | 'superset'
  rounds: number
  exercises: Exercise[]
}

export interface Exercise {
  name: string
  sets?: number
  reps?: string
  duration_sec?: number
  tempo?: string
  rest_sec?: number
  notes?: string
}

// Set Logging Types
export interface ExerciseSet {
  id: string
  sessionId: string
  exerciseName: string
  setNumber: number
  reps: number
  rpe: number // Rate of Perceived Exertion (1-10)
  painScore: number // Pain level (0-10)
  notes?: string
  completedAt: Date
}

// Achievement Types
export interface Achievement {
  id: string
  userId: string
  type: string
  name: string
  description: string
  earnedAt: Date
}

// Streak Types
export interface Streak {
  id: string
  userId: string
  current: number
  best: number
  lastWorkoutDate: Date
}

// Agent State Types
export interface AgentState {
  currentAgent: 'intake' | 'program' | 'coach' | 'gamification'
  sessionState: 'intake' | 'planning' | 'workout' | 'logging' | 'complete'
  userProfile?: UserProfile
  currentPlan?: WorkoutPlan
  currentSession?: WorkoutSession
}
