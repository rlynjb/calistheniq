import { 
  mockCurrentUserLevels,
  mockUserProgress,
  mockUserMilestones,
  type CurrentUserLevels,
  type MovementCategory,
  type UserProgress,
  type ProgressStats
} from './mock'

// Progress analysis utilities
export const calculateOverallLevel = (levels: CurrentUserLevels): number => {
  const total = levels.Push + levels.Pull + levels.Squat
  return Math.round((total / 3) * 10) / 10
}

export const findStrongestArea = (levels: CurrentUserLevels): MovementCategory => {
  return Object.entries(levels).reduce((a, b) => 
    levels[a[0] as MovementCategory] > levels[b[0] as MovementCategory] ? a : b
  )[0] as MovementCategory
}

export const findFocusArea = (levels: CurrentUserLevels): MovementCategory => {
  return Object.entries(levels).reduce((a, b) => 
    levels[a[0] as MovementCategory] < levels[b[0] as MovementCategory] ? a : b
  )[0] as MovementCategory
}

export const calculateProgressToMastery = (levels: CurrentUserLevels): number => {
  const total = levels.Push + levels.Pull + levels.Squat
  const maxTotal = 15 // 3 categories × 5 levels each
  return Math.round((total / maxTotal) * 100)
}

export const generateProgressStats = (levels: CurrentUserLevels): ProgressStats => ({
  overallLevel: calculateOverallLevel(levels),
  strongestArea: findStrongestArea(levels),
  focusArea: findFocusArea(levels),
  totalProgression: calculateProgressToMastery(levels),
  progressToMastery: calculateProgressToMastery(levels)
})

export const generatePersonalizedRecommendations = (levels: CurrentUserLevels): string[] => {
  const recommendations: string[] = []
  
  // Check for beginner-level recommendations
  if (levels.Squat === 0) {
    recommendations.push("Start with Level 0 Squat exercises focusing on stability and mini band assistance")
  }
  
  // Check for imbalanced development
  const minLevel = Math.min(...Object.values(levels))
  const maxLevel = Math.max(...Object.values(levels))
  
  if (minLevel < maxLevel) {
    const focusArea = findFocusArea(levels)
    recommendations.push(`Focus on balancing your weakest area (${focusArea}) to improve overall strength`)
  }
  
  // General recommendations
  recommendations.push("Master your current level exercises before advancing to prevent injury")
  recommendations.push("Consider working with your AI coach to create a balanced progression plan")
  
  return recommendations
}

export const calculateDaysTraining = (joinDate: Date): number => {
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - joinDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const calculateAverageWorkoutsPerWeek = (totalWorkouts: number, daysTraining: number): number => {
  const weeks = daysTraining / 7
  return Math.round((totalWorkouts / weeks) * 10) / 10
}

export const getNextLevelGoals = (levels: CurrentUserLevels) => {
  return Object.entries(levels).map(([category, level]) => ({
    category: category as MovementCategory,
    currentLevel: level,
    nextLevel: level + 1,
    canProgress: level < 5
  }))
}

// Main data export
export const currentLevelData = {
  userProgress: mockUserProgress,
  currentLevels: mockCurrentUserLevels,
  userMilestones: mockUserMilestones,
  
  // Computed data
  progressStats: generateProgressStats(mockCurrentUserLevels),
  personalizedRecommendations: generatePersonalizedRecommendations(mockCurrentUserLevels),
  daysTraining: calculateDaysTraining(mockUserProgress.joinDate),
  averageWorkoutsPerWeek: calculateAverageWorkoutsPerWeek(
    mockUserProgress.totalWorkouts, 
    calculateDaysTraining(mockUserProgress.joinDate)
  ),
  nextLevelGoals: getNextLevelGoals(mockCurrentUserLevels)
}
