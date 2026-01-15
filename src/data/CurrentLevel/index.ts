// Current Level Data Module
// Centralized exports for user level progress data and utilities

// Raw data and types
export {
  mockCurrentUserLevels,
  mockUserProgress,
  mockUserMilestones,
  type CurrentUserLevels,
  type MovementCategory,
  type UserProgress,
  type ProgressStats
} from './mock'

// Processed data and utilities
export {
  currentLevelData,
  
  // Analysis functions
  calculateOverallLevel,
  findStrongestArea,
  findFocusArea,
  calculateProgressToMastery,
  generateProgressStats,
  generatePersonalizedRecommendations,
  calculateDaysTraining,
  calculateAverageWorkoutsPerWeek,
  getNextLevelGoals
} from './normalization'
