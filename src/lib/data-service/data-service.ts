/**
 * Main Data Service - Unified access point for all data operations
 */

import { ExerciseService } from './ExerciseService'
import { UserService } from './UserService'
import { apiClient } from './api-client'

/**
 * Main Data Service - Unified access point
 */
export const dataService = {
  exercises: ExerciseService,
  userProgress: UserService,

  // Health check
  async healthCheck(): Promise<boolean> {
    const useMockData = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
    
    if (useMockData) {
      return Promise.resolve(true)
    }
    
    try {
      await apiClient.get('/.netlify/functions/health')
      return true
    } catch {
      return false
    }
  }
}
