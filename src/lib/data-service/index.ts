/**
 * Data Service Layer - Main exports
 * 
 * Centralized exports for all data services, utilities, and configuration
 */

// Core services
export { ExerciseService } from './exercise-service'
export { UserProgressService } from './user-progress-service'
export { WorkoutPlanService } from './workout-plan-service'

// Main data service
export { dataService } from './data-service'

// API client and configuration
export { apiClient, type ApiResponse, type ApiError } from './api-client'
export { DATA_SOURCE_CONFIG, type DataSourceConfig } from './config'

// Default export
export { dataService as default } from './data-service'
