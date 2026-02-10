/**
 * Netlify Function: Import Data
 *
 * Imports JSON data into Netlify Blob store.
 *
 * ENDPOINT
 * --------
 * POST /api/import - Import user and exercises data to blob store
 *
 * HOW IT WORKS
 * ------------
 * Data flows: JSON input → Netlify Blob
 *
 * SYNC WORKFLOWS
 * --------------
 * Pull prod → local:
 *   Step 1: Export from production
 *     curl https://your-site.netlify.app/api/export > backup.json
 *   Step 2: Import to local
 *     curl -X POST http://localhost:8888/api/import -d @backup.json -H "Content-Type: application/json"
 *
 * Push local → prod:
 *   Step 1: Export from local
 *     curl http://localhost:8888/api/export > backup.json
 *   Step 2: Import to production
 *     curl -X POST https://your-site.netlify.app/api/import -d @backup.json -H "Content-Type: application/json"
 *
 * IMPORTANT: You must run the export step first to create backup.json before importing.
 *
 * USAGE
 * -----
 * Step 1: Export data to file
 *   curl http://localhost:8888/api/export > backup.json
 *
 * Step 2: Import data from file
 *   curl -X POST http://localhost:8888/api/import -d @backup.json -H "Content-Type: application/json"
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

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed. Use POST to import data.', 405)
  }

  try {
    const body = await req.json()

    // Validate structure
    if (!body.data) {
      return errorResponse('Invalid format. Expected { data: { userData, workoutLevels } }', 400)
    }

    const { userData, workoutLevels } = body.data

    if (userData) {
      await userDataStore.set(userData)
    }

    if (workoutLevels) {
      await exerciseDataStore.setWorkoutLevels(workoutLevels)
    }

    return jsonResponse({
      success: true,
      message: 'Imported data to blob store',
      imported: {
        userData: Boolean(userData),
        workoutLevels: Boolean(workoutLevels)
      }
    })

  } catch (error) {
    console.error('Import error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to import data',
      500
    )
  }
}
