/**
 * Netlify Function: Seed Data
 *
 * POST /api/seed - Initialize blob store with mock data
 *
 * PREREQUISITES
 * -------------
 * 1. MSW must be disabled: NEXT_PUBLIC_MSW_ENABLED=false
 * 2. Netlify CLI installed: npm install -g netlify-cli
 * 3. Start server: netlify dev
 *
 * USAGE
 * -----
 * curl -X POST http://localhost:8888/api/seed
 *
 * WHAT GETS SEEDED
 * ----------------
 * User Data (/user/data):
 *   - currentLevels: { Push: 1, Pull: 1, Squat: 1 }
 *   - weeklyProgress: Workouts for upcoming week
 *
 * Workout Levels (/exercises/levels):
 *   - Level 1-5: Beginner through Expert
 *
 * VERIFY
 * ------
 * curl http://localhost:8888/api/user/data
 * curl http://localhost:8888/api/exercises/levels
 */

import type { Context } from '@netlify/functions'
import {
  userDataStore,
  exerciseDataStore,
  jsonResponse,
  errorResponse,
  handleCors
} from './core/infrastructure/blob'

import {
  MOCK_CurrentUserLevel,
  MOCK_weeklyWorkouts,
  workoutLevels
} from '../../src/mocks/data'

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return handleCors()
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed. Use POST to seed data.', 405)
  }

  try {
    const userData = {
      currentLevels: MOCK_CurrentUserLevel,
      weeklyProgress: MOCK_weeklyWorkouts,
      lastUpdated: new Date().toISOString()
    }

    await userDataStore.set(userData)
    await exerciseDataStore.setWorkoutLevels(workoutLevels)

    return jsonResponse({
      success: true,
      message: 'Seeded from mock data',
      data: { userData, workoutLevels }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to seed data',
      500
    )
  }
}

