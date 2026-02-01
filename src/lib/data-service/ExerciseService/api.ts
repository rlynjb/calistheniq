/**
 * Exercise API Service - Database/API backend implementation
 * 
 * Handles API calls to Netlify Functions for exercise data
 */

import { apiClient } from '../api-client'
import type { BaseExercise, WorkoutLevels } from './mocks/types'

export class Api {
  /**
   * Get all workout levels from API
   */
  static async getWorkoutLevels(): Promise<WorkoutLevels> {
    const response = await apiClient.get<WorkoutLevels>('/.netlify/functions/exercises/levels')
    return response.data
  }

  /**
   * Get exercises by level and category from API
   */
  static async getExercisesByLevel(level: number, category?: string): Promise<BaseExercise[]> {
    const params: Record<string, string> = { level: level.toString() }
    if (category) params.category = category
    
    const response = await apiClient.get<BaseExercise[]>('/.netlify/functions/exercises', params)
    return response.data
  }

  /**
   * Search exercises from API
   */
  static async searchExercises(query: string): Promise<BaseExercise[]> {
    const response = await apiClient.get<BaseExercise[]>('/.netlify/functions/exercises/search', {
      q: query
    })
    return response.data
  }
}
