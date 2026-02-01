/**
 * User Progress API Service - Database/API backend implementation
 * 
 * Handles API calls to Netlify Functions for user progress data
 */

import { apiClient } from '../api-client'
import type { WeeklyProgressData } from './mocks/WeeklyProgress/types'

export class Api {
  /**
   * Get user's current levels from API
   */
  static async getCurrentLevels(userId?: string): Promise<Record<string, number>> {
    const params: Record<string, string> = userId ? { userId } : {}
    const response = await apiClient.get<Record<string, number>>('/.netlify/functions/user/levels', params)
    return response.data
  }

  /**
   * Update user's level via API
   */
  static async updateUserLevel(category: string, level: number, userId?: string): Promise<boolean> {
    const response = await apiClient.put<{ success: boolean }>('/.netlify/functions/user/levels', {
      category,
      level,
      userId
    })
    return response.data.success
  }

  /**
   * Get user's weekly progress from API
   */
  static async getWeeklyProgress(userId?: string): Promise<WeeklyProgressData> {
    const params: Record<string, string> = userId ? { userId } : {}
    const response = await apiClient.get<WeeklyProgressData>('/.netlify/functions/user/progress/weekly', params)
    return response.data
  }
}
