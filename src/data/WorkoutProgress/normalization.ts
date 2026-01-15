import { 
  mockLastWorkout, 
  mockTodaysWorkout, 
  mockWorkoutHistory,
  type CompletedWorkout,
  type PlannedWorkout,
  type CompletedExercise,
  type PlannedExercise,
  type CompletedSet,
  type TargetSet
} from './mock'

// Workout progress analysis and utilities
export interface ProgressComparison {
  exerciseName: string
  lastTotal: number
  todayTotal: number
  improvement: number
  improvementPercent: number
  hasImprovement: boolean
  isDecline: boolean
  isMaintenance: boolean
}

export interface WorkoutStats {
  completionRate: number
  totalSetsCompleted: number
  totalSetsPlanned: number
  averageDuration: number
  exerciseCount: number
}

// Utility functions for workout analysis
export const calculateExerciseTotal = (
  sets: (CompletedSet | TargetSet)[]
): number => {
  return sets.reduce((sum, set) => {
    return sum + ('reps' in set ? (set.reps || 0) : (set.duration || 0))
  }, 0)
}

export const calculateCompletionRate = (exercise: CompletedExercise): number => {
  const completedSets = exercise.sets.filter(set => set.completed).length
  return Math.round((completedSets / exercise.sets.length) * 100)
}

export const generateProgressComparison = (
  lastWorkout: CompletedWorkout,
  todaysWorkout: PlannedWorkout
): ProgressComparison[] => {
  return todaysWorkout.exercises.map(todayExercise => {
    const lastExercise = lastWorkout.exercises.find(ex => ex.name === todayExercise.name)
    
    if (!lastExercise) {
      return {
        exerciseName: todayExercise.name,
        lastTotal: 0,
        todayTotal: calculateExerciseTotal(todayExercise.targetSets),
        improvement: 0,
        improvementPercent: 0,
        hasImprovement: false,
        isDecline: false,
        isMaintenance: true
      }
    }

    const lastTotal = calculateExerciseTotal(lastExercise.sets)
    const todayTotal = calculateExerciseTotal(todayExercise.targetSets)
    const improvement = todayTotal - lastTotal
    const improvementPercent = lastTotal > 0 ? Math.round((improvement / lastTotal) * 100) : 0

    return {
      exerciseName: todayExercise.name,
      lastTotal,
      todayTotal,
      improvement,
      improvementPercent,
      hasImprovement: improvement > 0,
      isDecline: improvement < 0,
      isMaintenance: improvement === 0
    }
  }).filter(comparison => comparison !== null)
}

export const calculateWorkoutStats = (workout: CompletedWorkout): WorkoutStats => {
  const totalSetsPlanned = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const totalSetsCompleted = workout.exercises.reduce((sum, ex) => 
    sum + ex.sets.filter(set => set.completed).length, 0
  )
  
  return {
    completionRate: Math.round((totalSetsCompleted / totalSetsPlanned) * 100),
    totalSetsCompleted,
    totalSetsPlanned,
    averageDuration: workout.duration,
    exerciseCount: workout.exercises.length
  }
}

export const getWorkoutHistory = (days: number = 7): CompletedWorkout[] => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return mockWorkoutHistory.filter(workout => workout.date >= cutoffDate)
}

export const getAverageWorkoutDuration = (workouts: CompletedWorkout[] = mockWorkoutHistory): number => {
  if (workouts.length === 0) return 0
  const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0)
  return Math.round(totalDuration / workouts.length)
}

export const getExerciseProgressTrend = (exerciseName: string, workouts: CompletedWorkout[] = mockWorkoutHistory): number[] => {
  return workouts
    .filter(workout => workout.exercises.some(ex => ex.name === exerciseName))
    .map(workout => {
      const exercise = workout.exercises.find(ex => ex.name === exerciseName)
      return exercise ? calculateExerciseTotal(exercise.sets) : 0
    })
}

// Main data exports - separate data from functions
export const workoutProgressData = {
  lastWorkout: mockLastWorkout,
  todaysWorkout: mockTodaysWorkout,
  workoutHistory: mockWorkoutHistory,
  
  // Computed data
  progressComparisons: generateProgressComparison(mockLastWorkout, mockTodaysWorkout),
  lastWorkoutStats: calculateWorkoutStats(mockLastWorkout),
  averageDuration: getAverageWorkoutDuration()
}
