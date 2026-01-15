// Workout Levels Data Module
// Centralized exports for workout level data and utilities

// Raw data exports
export { allExercises, type ExerciseWithMetadata } from './mock'

// Processed data and utilities
export {
  // Main data structures
  workoutLevels,
  exerciseCategorization,
  exerciseStats,
  
  // Utility arrays
  workoutLevelKeys,
  workoutLevelsArray,
  
  // Level access functions
  getLevelByKey,
  getLevelByIndex,
  getLevelKeyByIndex,
  getIndexByLevelKey,
  
  // Exercise lookup and filtering functions
  getExerciseById,
  getExercisesByCategory,
  getExercisesByLevel,
  getExercisesByDifficulty,
  getExercisesByEquipment,
  getExercisesByMovementType,
  searchExercisesByTag,
  searchExercisesByName,
  
  // Types
  type ExerciseCategorization
} from './mock-normalization'
