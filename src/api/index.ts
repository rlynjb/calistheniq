/**
 * API Module
 *
 * Centralized API access for the application.
 *
 * Usage:
 *   import { api } from '@/api'
 *   await api.healthCheck()
 */

import { apiClient } from './client'

// Main API object
export const api = {
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get('/health')
      return true
    } catch {
      return false
    }
  }
}

// Named exports for direct imports
export { apiClient } from './client'

// Type exports
export type {
  BaseExercise,
  BaseExerciseSet,
  ExerciseWithMetadata,
  ExercisesByCategory,
  ProgressionNotes,
  WorkoutLevel,
  WorkoutLevels,
  ExerciseLevelInfo
} from './exercises'

export type {
  CurrentUserLevels,
  MovementCategory,
  WorkoutSession,
  WeekDay,
  UserData
} from './user'

export type { ApiResponse, ApiError } from './client'
