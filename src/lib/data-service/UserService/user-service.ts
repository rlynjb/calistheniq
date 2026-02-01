/**
 * User Progress Service - Handles user progress and level tracking
 * 
 * Configure data source via: NEXT_PUBLIC_USER_PROGRESS_SOURCE
 * Options: 'mock' | 'localStorage' | 'netlifyBlob' | 'api'
 * Default: 'localStorage' (dev) | 'netlifyBlob' (prod)
 */

// Import storage implementations
import { LocalStorage } from './localStorage'
import { NetlifyBlob } from './netlifyBlob'
import { Api } from './api'

// Import mock data
import { currentLevelData } from './mocks/CurrentLevel'
import { weeklyProgressData, generateCompleteWeeklyProgress } from './mocks/WeeklyProgress'

// Data source type
type DataSource = 'mock' | 'localStorage' | 'netlifyBlob' | 'api'

export class UserService {
  private static get dataSource(): DataSource {
    const envSource = process.env.NEXT_PUBLIC_USER_PROGRESS_SOURCE as DataSource | undefined
    
    // Use environment variable if specified
    if (envSource) {
      return envSource
    }
    
    // Default: localStorage (dev) | netlifyBlob (prod)
    return process.env.NODE_ENV === 'production' ? 'netlifyBlob' : 'localStorage'
  }
  
  /**
   * Get user's current levels across categories
   */
  static async getCurrentLevels(userId?: string): Promise<Record<string, number>> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        return currentLevelData.currentLevels as unknown as Record<string, number>

      case 'localStorage':
        return await LocalStorage.getCurrentLevels() as unknown as Record<string, number>

      case 'netlifyBlob':
        return await NetlifyBlob.getCurrentLevels() as unknown as Record<string, number>

      case 'api':
        try {
          return await Api.getCurrentLevels(userId)
        } catch (error) {
          console.warn('API failed, falling back to netlifyBlob:', error)
          return await NetlifyBlob.getCurrentLevels() as unknown as Record<string, number>
        }

      default:
        return currentLevelData.currentLevels as unknown as Record<string, number>
    }
  }

  /**
   * Update user's level for a specific category
   */
  static async updateUserLevel(category: string, level: number, userId?: string): Promise<boolean> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        console.log(`[Mock] Updated ${category} level to ${level}`)
        return true

      case 'localStorage':
        return await LocalStorage.updateUserLevel(category, level)

      case 'netlifyBlob':
        return await NetlifyBlob.updateUserLevel(category, level)

      case 'api':
        try {
          return await Api.updateUserLevel(category, level, userId)
        } catch (error) {
          console.warn('API failed, falling back to netlifyBlob:', error)
          return await NetlifyBlob.updateUserLevel(category, level)
        }

      default:
        return false
    }
  }

  /**
   * Get user's weekly progress
   */
  static async getWeeklyProgress(userId?: string): Promise<typeof weeklyProgressData> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        return generateCompleteWeeklyProgress()

      case 'localStorage':
        return await LocalStorage.getWeeklyProgress()

      case 'netlifyBlob':
        return await NetlifyBlob.getWeeklyProgress()

      case 'api':
        try {
          return await Api.getWeeklyProgress(userId)
        } catch (error) {
          console.warn('API failed, falling back to netlifyBlob:', error)
          return await NetlifyBlob.getWeeklyProgress()
        }

      default:
        return generateCompleteWeeklyProgress()
    }
  }
  
  /**
   * Log a completed workout
   */
  static async logWorkout(workout: any): Promise<boolean> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        console.log('[Mock] Logged workout:', workout)
        return true

      case 'localStorage':
        return await LocalStorage.logWorkout(workout)

      case 'netlifyBlob':
        return await NetlifyBlob.logWorkout(workout)

      case 'api':
        // TODO: Implement API endpoint for workout logging
        console.warn('API workout logging not implemented, falling back to netlifyBlob')
        return await NetlifyBlob.logWorkout(workout)

      default:
        return false
    }
  }
  
  /**
   * Export user progress data (for backup)
   */
  static async exportData(): Promise<string> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        return JSON.stringify({ mock: true, message: 'Mock data cannot be exported' })

      case 'localStorage':
        return LocalStorage.export()

      case 'netlifyBlob':
      case 'api':
        return await NetlifyBlob.export()

      default:
        return '{}'
    }
  }
  
  /**
   * Import user progress data (from backup)
   */
  static async importData(jsonString: string): Promise<void> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        console.warn('[Mock] Import not supported for mock data')
        break

      case 'localStorage':
        LocalStorage.import(jsonString)
        break

      case 'netlifyBlob':
      case 'api':
        await NetlifyBlob.import(jsonString)
        break
    }
  }
  
  /**
   * Clear all user progress data
   */
  static async clearData(): Promise<void> {
    const dataSource = this.dataSource

    switch (dataSource) {
      case 'mock':
        console.warn('[Mock] Clear not supported for mock data')
        break

      case 'localStorage':
        LocalStorage.clear()
        break

      case 'netlifyBlob':
      case 'api':
        await NetlifyBlob.clear()
        break
    }
  }
}

