/**
 * Netlify Function: Seed Data
 *
 * Populates Netlify Blob store with data from mock files.
 *
 * ENDPOINT
 * --------
 * POST /api/seed - Seed user and exercises data from mock files
 *
 * HOW IT WORKS
 * ------------
 * Data flows: Mock files → Netlify Blob → App
 *
 * Sources:
 * - src/mocks/data/user.ts (currentLevels, weeklyProgress)
 * - src/mocks/data/exercises.ts (workoutLevels)
 *
 * INDUSTRY STANDARD: FIXTURES + SNAPSHOTS PATTERN
 * ------------------------------------------------
 * Fixtures (Mock Files):
 *   - Source of truth, version controlled
 *   - Contains logic (date generation, computed values)
 *   - Located in: src/mocks/data/
 *
 * Snapshots (Exported Data):
 *   - Captured runtime state from blob storage
 *   - Pure JSON data for review
 *   - Created via: curl http://localhost:8888/api/export > snapshot.json
 *
 * Workflow:
 *   1. seed: Push fixtures to blob storage
 *   2. App modifies data in blob during usage
 *   3. export: Capture blob state to snapshot file
 *   4. Developer reviews snapshot, updates fixtures if needed
 *
 * USAGE
 * -----
 * curl -X POST http://localhost:8888/api/seed
 *
 * PREREQUISITES
 * -------------
 * 1. MSW disabled: NEXT_PUBLIC_MSW_ENABLED=false
 * 2. Server running: netlify dev
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
      message: 'Seeded user and exercises from mock data',
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
