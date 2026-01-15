import type { BaseExercise, WorkoutLevel, WorkoutLevels, ExercisesByCategory } from '@/types'
import { allExercises, type ExerciseWithMetadata } from './mock'

// Exercise categorization interface
export interface ExerciseCategorization {
  byCategory: {
    Push: ExerciseWithMetadata[]
    Pull: ExerciseWithMetadata[]
    Squat: ExerciseWithMetadata[]
  }
  byLevel: {
    [key: number]: {
      name: string
      exercises: ExerciseWithMetadata[]
    }
  }
  byDifficulty: {
    Foundation: ExerciseWithMetadata[]
    Beginner: ExerciseWithMetadata[]
    Novice: ExerciseWithMetadata[]
    Intermediate: ExerciseWithMetadata[]
    Advanced: ExerciseWithMetadata[]
    Expert: ExerciseWithMetadata[]
  }
  byEquipment: {
    bodyweight: ExerciseWithMetadata[]
    band: ExerciseWithMetadata[]
    assisted: ExerciseWithMetadata[]
  }
  byMovementType: {
    isometric: ExerciseWithMetadata[]
    dynamic: ExerciseWithMetadata[]
    explosive: ExerciseWithMetadata[]
  }
}

// Generate categorized exercise data
export const exerciseCategorization: ExerciseCategorization = {
  byCategory: {
    Push: allExercises.filter(exercise => exercise.category === 'Push'),
    Pull: allExercises.filter(exercise => exercise.category === 'Pull'),
    Squat: allExercises.filter(exercise => exercise.category === 'Squat')
  },
  byLevel: {
    0: {
      name: "Foundation",
      exercises: allExercises.filter(exercise => exercise.level === 0)
    },
    1: {
      name: "Beginner", 
      exercises: allExercises.filter(exercise => exercise.level === 1)
    },
    2: {
      name: "Novice",
      exercises: allExercises.filter(exercise => exercise.level === 2)
    },
    3: {
      name: "Intermediate",
      exercises: allExercises.filter(exercise => exercise.level === 3)
    },
    4: {
      name: "Advanced",
      exercises: allExercises.filter(exercise => exercise.level === 4)
    },
    5: {
      name: "Expert",
      exercises: allExercises.filter(exercise => exercise.level === 5)
    }
  },
  byDifficulty: {
    Foundation: allExercises.filter(exercise => exercise.difficulty === 'Foundation'),
    Beginner: allExercises.filter(exercise => exercise.difficulty === 'Beginner'),
    Novice: allExercises.filter(exercise => exercise.difficulty === 'Novice'),
    Intermediate: allExercises.filter(exercise => exercise.difficulty === 'Intermediate'),
    Advanced: allExercises.filter(exercise => exercise.difficulty === 'Advanced'),
    Expert: allExercises.filter(exercise => exercise.difficulty === 'Expert')
  },
  byEquipment: {
    bodyweight: allExercises.filter(exercise => !exercise.equipment || exercise.equipment === undefined),
    band: allExercises.filter(exercise => exercise.equipment?.includes('band') || exercise.equipment?.includes('Band')),
    assisted: allExercises.filter(exercise => exercise.tags.includes('assisted') || exercise.tags.includes('chair'))
  },
  byMovementType: {
    isometric: allExercises.filter(exercise => 
      exercise.tags.includes('hold') || 
      exercise.tags.includes('hang') || 
      exercise.tags.includes('static') ||
      exercise.tempo === 'hold'
    ),
    dynamic: allExercises.filter(exercise => 
      !exercise.tags.includes('hold') && 
      !exercise.tags.includes('explosive') &&
      exercise.tempo !== 'hold' &&
      !exercise.tags.includes('jump')
    ),
    explosive: allExercises.filter(exercise => 
      exercise.tags.includes('explosive') || 
      exercise.tags.includes('jump') ||
      exercise.tags.includes('plyometric')
    )
  }
}

// Workout levels using the original structure but sourced from our exercise data
export const workoutLevels: WorkoutLevels = {
  foundation: {
    name: "Foundation",
    description: "Stability, control, and knee-friendly movements",
    exercises: {
      Push: exerciseCategorization.byLevel[0].exercises.filter(ex => ex.category === 'Push').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Pull: exerciseCategorization.byLevel[0].exercises.filter(ex => ex.category === 'Pull').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Squat: exerciseCategorization.byLevel[0].exercises.filter(ex => ex.category === 'Squat').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      }))
    }
  },
  beginner: {
    name: "Beginner",
    exercises: {
      Push: exerciseCategorization.byLevel[1].exercises.filter(ex => ex.category === 'Push').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Pull: exerciseCategorization.byLevel[1].exercises.filter(ex => ex.category === 'Pull').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Squat: exerciseCategorization.byLevel[1].exercises.filter(ex => ex.category === 'Squat').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      }))
    }
  },
  novice: {
    name: "Novice",
    exercises: {
      Push: exerciseCategorization.byLevel[2].exercises.filter(ex => ex.category === 'Push').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Pull: exerciseCategorization.byLevel[2].exercises.filter(ex => ex.category === 'Pull').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Squat: exerciseCategorization.byLevel[2].exercises.filter(ex => ex.category === 'Squat').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      }))
    }
  },
  intermediate: {
    name: "Intermediate",
    exercises: {
      Push: exerciseCategorization.byLevel[3].exercises.filter(ex => ex.category === 'Push').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Pull: exerciseCategorization.byLevel[3].exercises.filter(ex => ex.category === 'Pull').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Squat: exerciseCategorization.byLevel[3].exercises.filter(ex => ex.category === 'Squat').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      }))
    }
  },
  advanced: {
    name: "Advanced",
    exercises: {
      Push: exerciseCategorization.byLevel[4].exercises.filter(ex => ex.category === 'Push').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Pull: exerciseCategorization.byLevel[4].exercises.filter(ex => ex.category === 'Pull').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Squat: exerciseCategorization.byLevel[4].exercises.filter(ex => ex.category === 'Squat').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      }))
    }
  },
  expert: {
    name: "Expert",
    exercises: {
      Push: exerciseCategorization.byLevel[5].exercises.filter(ex => ex.category === 'Push').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Pull: exerciseCategorization.byLevel[5].exercises.filter(ex => ex.category === 'Pull').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      })),
      Squat: exerciseCategorization.byLevel[5].exercises.filter(ex => ex.category === 'Squat').map(ex => ({
        name: ex.name,
        sets: ex.sets,
        tempo: ex.tempo,
        rest: ex.rest,
        equipment: ex.equipment,
        notes: ex.notes
      }))
    }
  }
}

// Statistics and insights
export const exerciseStats = {
  totalExercises: allExercises.length,
  exercisesByCategory: {
    Push: exerciseCategorization.byCategory.Push.length,
    Pull: exerciseCategorization.byCategory.Pull.length,
    Squat: exerciseCategorization.byCategory.Squat.length
  },
  exercisesByLevel: Object.entries(exerciseCategorization.byLevel).map(([level, data]) => ({
    level: parseInt(level),
    name: data.name,
    count: data.exercises.length
  })),
  equipmentTypes: {
    bodyweight: exerciseCategorization.byEquipment.bodyweight.length,
    band: exerciseCategorization.byEquipment.band.length,
    assisted: exerciseCategorization.byEquipment.assisted.length
  },
  movementTypes: {
    isometric: exerciseCategorization.byMovementType.isometric.length,
    dynamic: exerciseCategorization.byMovementType.dynamic.length,
    explosive: exerciseCategorization.byMovementType.explosive.length
  }
}

// Utility functions for workout levels
export const workoutLevelKeys = Object.keys(workoutLevels) as Array<keyof typeof workoutLevels>
export const workoutLevelsArray = Object.values(workoutLevels)

// Get level by key
export const getLevelByKey = (key: keyof typeof workoutLevels) => workoutLevels[key]

// Get level by index (0-based)
export const getLevelByIndex = (index: number) => workoutLevelsArray[index]

// Get level key by index  
export const getLevelKeyByIndex = (index: number) => workoutLevelKeys[index]

// Get index by level key
export const getIndexByLevelKey = (key: keyof typeof workoutLevels) => workoutLevelKeys.indexOf(key)

// Utility functions for exercise lookup and filtering
export const getExerciseById = (id: string) => allExercises.find(exercise => exercise.id === id)

export const getExercisesByCategory = (category: 'Push' | 'Pull' | 'Squat') => 
  exerciseCategorization.byCategory[category]

export const getExercisesByLevel = (level: number) => 
  exerciseCategorization.byLevel[level]?.exercises || []

export const getExercisesByDifficulty = (difficulty: keyof ExerciseCategorization['byDifficulty']) =>
  exerciseCategorization.byDifficulty[difficulty]

export const getExercisesByEquipment = (equipment: keyof ExerciseCategorization['byEquipment']) =>
  exerciseCategorization.byEquipment[equipment]

export const getExercisesByMovementType = (movementType: keyof ExerciseCategorization['byMovementType']) =>
  exerciseCategorization.byMovementType[movementType]

export const searchExercisesByTag = (tag: string) =>
  allExercises.filter(exercise => exercise.tags.includes(tag))

export const searchExercisesByName = (nameQuery: string) =>
  allExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(nameQuery.toLowerCase())
  )
