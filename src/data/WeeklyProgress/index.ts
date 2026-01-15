// WeeklyProgress Module Exports
// Clean export interface for WeeklyProgress data

export type { 
  WeekDay, 
  WeeklyStats, 
  WeeklyProgressData 
} from './mock'

export { 
  generateWeeklyProgress,
  calculateWeeklyStats,
  generateMotivationalMessage,
  getRelevantAchievements,
  generateCompleteWeeklyProgress,
  weeklyProgressData
} from './normalization'
