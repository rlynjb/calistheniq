// Workout Progress Data Module
// Centralized exports for workout progress data and utilities

// Raw data and types
export {
  mockLastWorkout,
  mockTodaysWorkout,
  mockWorkoutHistory,
  type CompletedSet,
  type CompletedExercise,
  type CompletedWorkout,
  type TargetSet,
  type PlannedExercise,
  type PlannedWorkout
} from './mock'

// Processed data and utilities
export {
  workoutProgressData,
  
  // Analysis functions
  calculateExerciseTotal,
  calculateCompletionRate,
  generateProgressComparison,
  calculateWorkoutStats,
  getWorkoutHistory,
  getAverageWorkoutDuration,
  getExerciseProgressTrend,
  
  // Types
  type ProgressComparison,
  type WorkoutStats
} from './normalization'
