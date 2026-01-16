// Current Level Data Types
export interface CurrentUserLevels {
  Push: number
  Pull: number
  Squat: number
}

export type MovementCategory = keyof CurrentUserLevels

// Mock data for user's current progress
export const mockCurrentUserLevels: CurrentUserLevels = {
  Push: 1,
  Pull: 1,
  Squat: 0
}
