/**
 * MSW Mocks Module
 *
 * Export handlers, utilities, and mock data for Mock Service Worker.
 */

export { handlers } from './handlers'
export { MSWProvider } from './MSWProvider'

// Re-export mock data for database seeding and tests
export {
  allExercises,
  workoutLevels,
  MOCK_CurrentUserLevel,
  MOCK_weeklyWorkouts,
} from './data'
