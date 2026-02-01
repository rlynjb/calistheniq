/**
 * Workout Plan Service - Handles workout plans and session logging
 */

import { apiClient } from '../api-client'
import { DATA_SOURCE_CONFIG } from '../config'

export class WorkoutPlanService {
  /**
   * Get recommended workout plan for user
   */
  static async getRecommendedWorkout(userId?: string, preferences?: any): Promise<any> {
    if (DATA_SOURCE_CONFIG.USE_MOCK_DATA || !DATA_SOURCE_CONFIG.FEATURES.USE_DATABASE_WORKOUT_PLANS) {
      // Return mock workout plan
      return Promise.resolve({
        id: 'mock_workout_1',
        title: 'Full Body Beginner Strength',
        description: '25-minute full-body beginner workout - Focus on form and controlled movement',
        duration: 25,
        difficulty: 'beginner',
        type: 'strength',
        equipment: ['bodyweight', 'trx'],
        exercises: [
          {
            name: 'Ankle Rocks',
            sets: 1,
            reps: '45 seconds each direction',
            difficulty: 'beginner',
            notes: 'Gentle mobility warm-up for ankles'
          }
        ]
      })
    }

    try {
      // TODO: Replace with actual API endpoint
      const response = await apiClient.post<any>('/.netlify/functions/workouts/recommend', {
        userId,
        preferences
      })
      return response.data
    } catch (error) {
      console.warn('Failed to fetch workout plan from API, falling back to mock data:', error)
      return {
        id: 'fallback_workout',
        title: 'Basic Workout',
        description: 'Fallback workout plan',
        exercises: []
      }
    }
  }

  /**
   * Log completed workout session
   */
  static async logWorkoutSession(sessionData: any, userId?: string): Promise<boolean> {
    if (DATA_SOURCE_CONFIG.USE_MOCK_DATA || !DATA_SOURCE_CONFIG.FEATURES.USE_DATABASE_WORKOUT_PLANS) {
      // Mock logging
      console.log(`Mock: Logged workout session for user ${userId || 'default'}`, sessionData)
      return Promise.resolve(true)
    }

    try {
      // TODO: Replace with actual API endpoint
      const response = await apiClient.post<{ success: boolean }>('/.netlify/functions/workouts/log', {
        ...sessionData,
        userId
      })
      return response.data.success
    } catch (error) {
      console.warn('Failed to log workout session:', error)
      return false
    }
  }
}
