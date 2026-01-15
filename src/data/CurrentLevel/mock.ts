import type { BaseExercise } from '@/types'

// Current Level Data Types
export interface CurrentUserLevels {
  Push: number
  Pull: number
  Squat: number
}

export type MovementCategory = keyof CurrentUserLevels

export interface UserProgress {
  currentLevels: CurrentUserLevels
  totalWorkouts: number
  joinDate: Date
  lastWorkoutDate: Date
  achievements: string[]
}

export interface ProgressStats {
  overallLevel: number
  strongestArea: MovementCategory
  focusArea: MovementCategory
  totalProgression: number
  progressToMastery: number
}

// Mock data for user's current progress
export const mockCurrentUserLevels: CurrentUserLevels = {
  Push: 1,
  Pull: 1,
  Squat: 0
}

export const mockUserProgress: UserProgress = {
  currentLevels: mockCurrentUserLevels,
  totalWorkouts: 12,
  joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
  lastWorkoutDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
  achievements: [
    "First Workout Complete",
    "Push Level 1 Achieved",
    "Pull Level 1 Achieved",
    "7-Day Streak"
  ]
}

// Mock data for user milestones and goals
export const mockUserMilestones = [
  {
    category: "Push" as MovementCategory,
    targetLevel: 2,
    currentProgress: 75,
    estimatedDaysToComplete: 14
  },
  {
    category: "Pull" as MovementCategory,
    targetLevel: 2,
    currentProgress: 60,
    estimatedDaysToComplete: 18
  },
  {
    category: "Squat" as MovementCategory,
    targetLevel: 1,
    currentProgress: 30,
    estimatedDaysToComplete: 10
  }
]
