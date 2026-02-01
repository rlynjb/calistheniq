import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'
import { getExercisesWithDifficulty } from './core/infrastructure/database/queries'

/**
 * Exercises API Endpoint
 * 
 * Provides access to exercise data with flexible filtering and grouping options.
 * Supports querying by level, category, and output format.
 * 
 * Query Parameters:
 * - level: Filter by difficulty level (0-5)
 * - category: Filter by movement category (Push, Pull, Squat)
 * - grouped: Return exercises grouped by level (true/false)
 * 
 * Examples:
 * - GET /exercises → All exercises (flat array)
 * - GET /exercises?category=Push → Only Push exercises
 * - GET /exercises?level=2 → Only level 2 exercises
 * - GET /exercises?grouped=true → Exercises grouped by level
 * - GET /exercises?grouped=true&category=Push → Push exercises grouped by level
 */

interface ExercisesQuery {
  level?: string      // Filter by level number (0-5)
  category?: string   // Filter by category (Push, Pull, Squat)
  grouped?: string    // Return grouped by level (true/false)
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  // CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        message: 'This endpoint only supports GET requests'
      })
    }
  }

  try {
    const startTime = Date.now()
    
    // Parse query parameters
    const params = (event.queryStringParameters || {}) as ExercisesQuery
    const { level, category, grouped } = params

    console.log('Exercises endpoint called with params:', { level, category, grouped })

    // Fetch exercises from database (filtered by category if provided)
    const exercises = await getExercisesWithDifficulty(category)

    // Filter by level if specified
    let filteredExercises = exercises
    if (level !== undefined) {
      const levelNum = parseInt(level, 10)
      
      // Validate level number
      if (isNaN(levelNum) || levelNum < 0 || levelNum > 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid level parameter',
            message: 'Level must be a number between 0 and 5'
          })
        }
      }
      
      filteredExercises = exercises.filter(ex => ex.level_order === levelNum)
    }

    // Return grouped format if requested (matches WorkoutLevels type)
    if (grouped === 'true') {
      const groupedData = filteredExercises.reduce((acc, exercise) => {
        const levelKey = `level${exercise.level_order}`
        
        // Initialize level if not exists
        if (!acc[levelKey]) {
          acc[levelKey] = {
            name: exercise.difficulty,
            description: exercise.difficulty_description,
            exercises: {}
          }
        }
        
        // Initialize category array if not exists
        const cat = exercise.category
        if (!acc[levelKey].exercises[cat]) {
          acc[levelKey].exercises[cat] = []
        }
        
        // Add exercise to category
        acc[levelKey].exercises[cat].push({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.default_sets,
          tempo: exercise.default_tempo,
          rest: exercise.default_rest_seconds,
          equipment: exercise.default_equipment,
          notes: exercise.default_notes,
          tags: exercise.tags
        })
        
        return acc
      }, {} as any)

      const processingTime = Date.now() - startTime

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: groupedData,
          metadata: {
            totalExercises: filteredExercises.length,
            filters: { level, category },
            format: 'grouped',
            processingTimeMs: processingTime
          }
        })
      }
    }

    // Return flat list format
    const flatData = filteredExercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      difficulty: exercise.difficulty,
      level: exercise.level_order,
      sets: exercise.default_sets,
      tempo: exercise.default_tempo,
      rest: exercise.default_rest_seconds,
      equipment: exercise.default_equipment,
      notes: exercise.default_notes,
      tags: exercise.tags
    }))

    const processingTime = Date.now() - startTime

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: flatData,
        metadata: {
          totalExercises: flatData.length,
          filters: { level, category },
          format: 'flat',
          processingTimeMs: processingTime
        }
      })
    }

  } catch (error) {
    console.error('Error fetching exercises:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch exercises',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }
}
