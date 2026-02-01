/**
 * User Progress Service - Handles user progress and level tracking
 */

import { apiClient } from '../api-client'
import { DATA_SOURCE_CONFIG } from '../config'

// Import existing mock data
import { currentLevelData } from './mocks/CurrentLevel'
import { weeklyProgressData, generateCompleteWeeklyProgress } from './mocks/WeeklyProgress'

export class UserProgressService {
  /**
   * Get user's current levels across categories
   */
  static async getCurrentLevels(userId?: string): Promise<Record<string, number>> {
    if (DATA_SOURCE_CONFIG.USE_MOCK_DATA || !DATA_SOURCE_CONFIG.FEATURES.USE_DATABASE_USER_PROGRESS) {
      return Promise.resolve(currentLevelData.currentLevels as unknown as Record<string, number>)
    }

    try {
      // TODO: Replace with actual API endpoint
      const params: Record<string, string> = userId ? { userId } : {}
      const response = await apiClient.get<Record<string, number>>('/.netlify/functions/user/levels', params)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch user levels from API, falling back to mock data:', error)
      return currentLevelData.currentLevels as unknown as Record<string, number>
    }
  }

  /**
   * Update user's level for a specific category
   */
  static async updateUserLevel(category: string, level: number, userId?: string): Promise<boolean> {
    if (DATA_SOURCE_CONFIG.USE_MOCK_DATA || !DATA_SOURCE_CONFIG.FEATURES.USE_DATABASE_USER_PROGRESS) {
      // Mock update - just log it
      console.log(`Mock: Updated ${category} level to ${level} for user ${userId || 'default'}`)
      return Promise.resolve(true)
    }

    try {
      // TODO: Replace with actual API endpoint
      const response = await apiClient.put<{ success: boolean }>('/.netlify/functions/user/levels', {
        category,
        level,
        userId
      })
      return response.data.success
    } catch (error) {
      console.warn('Failed to update user level:', error)
      return false
    }
  }

  /**
   * Get user's weekly progress
   */
  static async getWeeklyProgress(userId?: string): Promise<typeof weeklyProgressData> {
    if (DATA_SOURCE_CONFIG.USE_MOCK_DATA || !DATA_SOURCE_CONFIG.FEATURES.USE_DATABASE_USER_PROGRESS) {
      return Promise.resolve(generateCompleteWeeklyProgress())
    }

    try {
      // TODO: Replace with actual API endpoint
      const params: Record<string, string> = userId ? { userId } : {}
      const response = await apiClient.get<typeof weeklyProgressData>('/.netlify/functions/user/progress/weekly', params)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch weekly progress from API, falling back to mock data:', error)
      return generateCompleteWeeklyProgress()
    }
  }
}
