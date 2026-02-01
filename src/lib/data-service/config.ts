/**
 * Configuration for data sources and API endpoints
 */

/**
 * NOTE:
 * check where its retrieving MOCK data from.
 * use src/data for mocks
 * find a way to move src/data to data-service
 */
export const DATA_SOURCE_CONFIG = {
  // Toggle between 'mock' and 'api' data sources
  USE_MOCK_DATA: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  
  // API base configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  TIMEOUT: 10000, // 10 seconds
  
  // Feature flags for gradual rollout
  FEATURES: {
    USE_DATABASE_EXERCISES: process.env.NEXT_PUBLIC_USE_DATABASE_EXERCISES === 'true',
    USE_DATABASE_USER_PROGRESS: process.env.NEXT_PUBLIC_USE_DATABASE_USER_PROGRESS === 'true',
    USE_DATABASE_WORKOUT_PLANS: process.env.NEXT_PUBLIC_USE_DATABASE_WORKOUT_PLANS === 'true',
  }
} as const

export type DataSourceConfig = typeof DATA_SOURCE_CONFIG
