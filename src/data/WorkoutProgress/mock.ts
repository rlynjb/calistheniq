import type { BaseExercise, BaseExerciseSet } from '@/types'

// Workout Progress Data Types
export interface CompletedSet extends BaseExerciseSet {
  completed: boolean
}

export interface CompletedExercise extends BaseExercise {
  sets: CompletedSet[]
}

export interface CompletedWorkout {
  date: Date
  duration: number
  exercises: CompletedExercise[]
}

export interface TargetSet extends BaseExerciseSet {}

export interface PlannedExercise {
  name: string
  tempo?: string
  rest?: number
  equipment?: string
  notes?: string
  targetSets: TargetSet[]
}

export interface PlannedWorkout {
  exercises: PlannedExercise[]
}

// Mock data for workout progress tracking
export const mockLastWorkout: CompletedWorkout = {
  date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  duration: 18,
  exercises: [
    {
      name: "Push-ups",
      tempo: "2-1-2-1",
      rest: 60,
      sets: [
        { reps: 8, completed: true },
        { reps: 6, completed: true },
        { reps: 5, completed: true }
      ]
    },
    {
      name: "Pike Push-ups",
      tempo: "2-1-2-1",
      rest: 90,
      sets: [
        { reps: 5, completed: true },
        { reps: 4, completed: true },
        { reps: 3, completed: false }
      ]
    },
    {
      name: "Plank Hold",
      tempo: "hold",
      rest: 60,
      sets: [
        { duration: 45, completed: true },
        { duration: 35, completed: true }
      ]
    }
  ]
}

export const mockTodaysWorkout: PlannedWorkout = {
  exercises: [
    {
      name: "Push-ups",
      tempo: "2-1-2-1",
      rest: 60,
      targetSets: [
        { reps: 10 },
        { reps: 8 },
        { reps: 6 }
      ],
      notes: "Increase reps by 2 from last session"
    },
    {
      name: "Pike Push-ups",
      tempo: "2-1-2-1", 
      rest: 90,
      targetSets: [
        { reps: 6 },
        { reps: 5 },
        { reps: 4 }
      ],
      notes: "Focus on completing all sets"
    },
    {
      name: "Plank Hold",
      tempo: "hold",
      rest: 60,
      targetSets: [
        { duration: 50 },
        { duration: 45 }
      ],
      notes: "Hold 5 seconds longer than last time"
    }
  ]
}

// Additional mock data for variety
export const mockWorkoutHistory: CompletedWorkout[] = [
  mockLastWorkout,
  {
    date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    duration: 16,
    exercises: [
      {
        name: "Push-ups",
        tempo: "2-1-2-1",
        rest: 60,
        sets: [
          { reps: 6, completed: true },
          { reps: 5, completed: true },
          { reps: 4, completed: true }
        ]
      },
      {
        name: "Pike Push-ups",
        tempo: "2-1-2-1",
        rest: 90,
        sets: [
          { reps: 4, completed: true },
          { reps: 3, completed: true },
          { reps: 3, completed: true }
        ]
      }
    ]
  }
]
