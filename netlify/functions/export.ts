/**
 * Netlify Function: Export Data
 *
 * GET /api/export - Export current blob store data as JSON
 * GET /api/export?type=user - Export only user data
 * GET /api/export?type=exercises - Export only exercises data
 *
 * USAGE
 * -----
 * curl http://localhost:8888/api/export
 * curl "http://localhost:8888/api/export?type=user"
 * curl "http://localhost:8888/api/export?type=exercises"
 */

import type { Context } from '@netlify/functions'
import {
  userDataStore,
  exerciseDataStore,
  jsonResponse,
  errorResponse,
  handleCors
} from './core/infrastructure/blob'

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return handleCors()
  }

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed. Use GET to export data.', 405)
  }

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    // Export user data only
    if (type === 'user') {
      const userData = await userDataStore.get()
      return jsonResponse(userData)
    }

    // Export exercises only
    if (type === 'exercises') {
      const workoutLevels = await exerciseDataStore.getWorkoutLevels()
      return jsonResponse(workoutLevels)
    }

    // Export both (default)
    const userData = await userDataStore.get()
    const workoutLevels = await exerciseDataStore.getWorkoutLevels()

    return jsonResponse({
      success: true,
      exportedAt: new Date().toISOString(),
      data: { userData, workoutLevels }
    })

  } catch (error) {
    console.error('Export error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to export data',
      500
    )
  }
}

