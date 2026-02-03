import { MOCK_weeklyWorkouts } from './WeeklyProgress'
import { MOCK_CurrentUserLevel } from './CurrentLevel/';

export const MOCK_UserData = {
  currentLevels: MOCK_CurrentUserLevel,
  weeklyProgress: MOCK_weeklyWorkouts,
  completedWorkouts: [],
  levelProgress: {
    Push: { currentReps: 0, requiredReps: 50, workoutsCompleted: 0, requiredWorkouts: 3, lastUpdated: new Date().toISOString() },
    Pull: { currentReps: 0, requiredReps: 50, workoutsCompleted: 0, requiredWorkouts: 3, lastUpdated: new Date().toISOString() },
    Squat: { currentReps: 0, requiredReps: 50, workoutsCompleted: 0, requiredWorkouts: 3, lastUpdated: new Date().toISOString() }
  },
  lastUpdated: new Date().toISOString()
}