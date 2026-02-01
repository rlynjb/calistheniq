/**
 * Data Service Layer - Main exports
 * 
 * Centralized exports for all data services, utilities, and configuration
 */

// Core services
export { ExerciseService } from './ExerciseService'
export { UserService } from './UserService'

// Main data service
export { dataService } from './data-service'

// API client
export { apiClient, type ApiResponse, type ApiError } from './api-client'

// Default export
export { dataService as default } from './data-service'
