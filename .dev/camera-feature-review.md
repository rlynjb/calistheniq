# Phase 2A: Camera Auto Rep Counter — Code Review

All new files for the camera-based automatic rep counting feature.
The feature adds on-device pose detection via MediaPipe, a rep counting state machine,
and a standalone `/workout` page accessible from the bottom nav.

Camera sessions produce the same `WorkoutSession` shape as manual sessions
and flow through the existing `logSession()` — no type changes.

---

## Table of Contents

1. [Dependency](#1-dependency)
2. [Pose Library (`src/lib/pose/`)](#2-pose-library)
   - [landmarks.ts](#landmarks)
   - [angles.ts](#angles)
   - [rep-counter.ts](#rep-counter)
   - [mediapipe.ts](#mediapipe)
   - [exercises/pushup.ts](#pushup)
   - [exercises/squat.ts](#squat)
   - [exercises/plank.ts](#plank)
3. [Workout Feature (`src/features/workout/`)](#3-workout-feature)
   - [useWorkoutSession.ts](#useworkoutsession)
   - [WorkoutView.tsx](#workoutview)
   - [CameraView.tsx](#cameraview)
   - [SkeletonOverlay.tsx](#skeletonoverlay)
   - [WorkoutHUD.tsx](#workouthud)
   - [WorkoutResult.tsx](#workoutresult)
   - [ExerciseSelector.tsx](#exerciseselector)
   - [workout.css](#workoutcss)
   - [index.ts](#barrel)
4. [Routing & Nav](#4-routing--nav)
   - [app/workout/page.tsx](#workout-page)
   - [BottomNav.tsx (modified)](#bottomnav)
5. [Tests](#5-tests)
   - [angles.test.ts](#angles-tests)
   - [rep-counter.test.ts](#rep-counter-tests)
   - [plank.test.ts](#plank-tests)

---

## 1. Dependency

```
npm install @mediapipe/tasks-vision
```

WASM runtime + model loaded from CDN at runtime (not bundled):
- WASM: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
- Model: `pose_landmarker_lite` (smallest/fastest for mobile)

---

## 2. Pose Library

Pure logic layer — no React, no side effects (except mediapipe.ts).

<a id="landmarks"></a>
### `src/lib/pose/landmarks.ts`

```ts
/**
 * MediaPipe Pose landmark types and index constants.
 *
 * Only the landmarks needed for rep counting are enumerated here.
 * Full list: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */

/** A single pose landmark with normalized coordinates and visibility score. */
export type Landmark = {
  /** Normalized X coordinate (0.0–1.0, left to right). */
  x: number
  /** Normalized Y coordinate (0.0–1.0, top to bottom). */
  y: number
  /** Relative depth (smaller = closer to camera). */
  z: number
  /** Visibility confidence (0.0–1.0). */
  visibility: number
}

/** MediaPipe Pose landmark indices used for exercise detection. */
export const POSE = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const

/**
 * Connections between landmarks for skeleton rendering.
 * Each pair is [fromIndex, toIndex].
 */
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER],
  [POSE.LEFT_SHOULDER, POSE.LEFT_HIP],
  [POSE.RIGHT_SHOULDER, POSE.RIGHT_HIP],
  [POSE.LEFT_HIP, POSE.RIGHT_HIP],
  // Left arm
  [POSE.LEFT_SHOULDER, POSE.LEFT_ELBOW],
  [POSE.LEFT_ELBOW, POSE.LEFT_WRIST],
  // Right arm
  [POSE.RIGHT_SHOULDER, POSE.RIGHT_ELBOW],
  [POSE.RIGHT_ELBOW, POSE.RIGHT_WRIST],
  // Left leg
  [POSE.LEFT_HIP, POSE.LEFT_KNEE],
  [POSE.LEFT_KNEE, POSE.LEFT_ANKLE],
  // Right leg
  [POSE.RIGHT_HIP, POSE.RIGHT_KNEE],
  [POSE.RIGHT_KNEE, POSE.RIGHT_ANKLE],
]
```

---

<a id="angles"></a>
### `src/lib/pose/angles.ts`

```ts
/**
 * Joint angle calculation utilities for pose-based rep counting.
 * Pure math functions — no React, no side effects.
 */
import type { Landmark } from './landmarks'

/**
 * Calculate the angle at point B formed by the line segments BA and BC.
 * Returns degrees in the range [0, 180].
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }

  const dot = ba.x * bc.x + ba.y * bc.y
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y)
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y)

  if (magBA === 0 || magBC === 0) return 0

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

/**
 * Exponential moving average for angle smoothing.
 * Higher factor = more smoothing (slower response).
 *
 * @param current - The new raw angle value.
 * @param previous - The previously smoothed value.
 * @param factor - Smoothing factor (0 = no smoothing, 1 = fully smoothed). Typical: 0.3.
 */
export function smoothAngle(current: number, previous: number, factor: number): number {
  return previous + factor * (current - previous)
}

/**
 * Average two bilateral landmarks (e.g., left + right shoulder)
 * for more robust angle calculation.
 */
export function averageLandmarks(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  }
}
```

---

<a id="rep-counter"></a>
### `src/lib/pose/rep-counter.ts`

```ts
/**
 * Generic rep counting state machine.
 * Configurable angle thresholds for different exercises.
 * Pure logic — no React, no side effects.
 */

/** Phases of a single rep cycle. */
export type RepPhase = 'idle' | 'ready' | 'down' | 'bottom' | 'up'

/** Configuration for the rep counter thresholds. */
export interface RepCounterConfig {
  /** Angle (degrees) at the starting/extended position. */
  readyAngle: number
  /** Angle (degrees) at the bottom/contracted position. */
  bottomAngle: number
  /** Degrees of buffer to prevent phase flickering. */
  hysteresis: number
}

/** Result of processing a single frame. */
export interface RepUpdateResult {
  /** Whether the phase changed this frame. */
  phaseChanged: boolean
  /** Whether a rep was completed this frame. */
  repCompleted: boolean
  /** Current phase after update. */
  phase: RepPhase
  /** Total rep count. */
  count: number
}

/**
 * Stateful rep counter that tracks phase transitions
 * as joint angles change frame-by-frame.
 *
 * Transition flow:
 *   idle → ready → down → bottom → up → ready (count++)
 *
 * The counter expects the angle to decrease during the "down" phase
 * (e.g., elbow bending for push-ups) and increase during "up".
 */
export class RepCounter {
  phase: RepPhase = 'idle'
  count = 0

  private config: RepCounterConfig

  constructor(config: RepCounterConfig) {
    this.config = config
  }

  /** Process a new angle reading and return the update result. */
  update(angle: number): RepUpdateResult {
    const prev = this.phase
    const { readyAngle, bottomAngle, hysteresis } = this.config
    let repCompleted = false

    switch (this.phase) {
      case 'idle':
        if (angle >= readyAngle - hysteresis) {
          this.phase = 'ready'
        }
        break

      case 'ready':
        if (angle < readyAngle - hysteresis) {
          this.phase = 'down'
        }
        break

      case 'down':
        if (angle <= bottomAngle + hysteresis) {
          this.phase = 'bottom'
        } else if (angle >= readyAngle) {
          // Went back up without reaching bottom — reset to ready
          this.phase = 'ready'
        }
        break

      case 'bottom':
        if (angle > bottomAngle + hysteresis) {
          this.phase = 'up'
        }
        break

      case 'up':
        if (angle >= readyAngle - hysteresis) {
          this.count++
          this.phase = 'ready'
          repCompleted = true
        } else if (angle <= bottomAngle + hysteresis) {
          // Went back down — restart from bottom
          this.phase = 'bottom'
        }
        break
    }

    return {
      phaseChanged: this.phase !== prev,
      repCompleted,
      phase: this.phase,
      count: this.count,
    }
  }

  /** Reset the counter to initial state. */
  reset(): void {
    this.phase = 'idle'
    this.count = 0
  }
}
```

---

<a id="mediapipe"></a>
### `src/lib/pose/mediapipe.ts`

```ts
/**
 * MediaPipe PoseLandmarker wrapper.
 * Manages model loading, video processing loop, and cleanup.
 */
import {
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision'
import type { Landmark } from './landmarks'

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_CDN = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

export interface PoseDetectorCallbacks {
  /** Called with pose landmarks on each processed frame. */
  onResults: (landmarks: Landmark[]) => void
  /** Called when an error occurs during detection. */
  onError?: (error: Error) => void
}

/**
 * Wraps MediaPipe PoseLandmarker with a requestAnimationFrame loop
 * for continuous video pose detection.
 */
export class PoseDetector {
  private landmarker: PoseLandmarker | null = null
  private callbacks: PoseDetectorCallbacks
  private animFrameId: number | null = null
  private running = false

  private constructor(callbacks: PoseDetectorCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Create and initialize a PoseDetector.
   * Loads the WASM runtime and pose model from CDN.
   */
  static async create(callbacks: PoseDetectorCallbacks): Promise<PoseDetector> {
    const detector = new PoseDetector(callbacks)

    const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
    detector.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_CDN,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    return detector
  }

  /** Start processing frames from a video element. */
  start(video: HTMLVideoElement): void {
    if (this.running) return
    this.running = true

    let lastTime = -1

    const processFrame = () => {
      if (!this.running || !this.landmarker) return

      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime
        try {
          const result = this.landmarker.detectForVideo(video, performance.now())
          if (result.landmarks && result.landmarks.length > 0) {
            // Map MediaPipe landmarks to our Landmark type
            const pose: Landmark[] = result.landmarks[0].map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility ?? 0,
            }))
            this.callbacks.onResults(pose)
          }
        } catch (err) {
          this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
        }
      }

      this.animFrameId = requestAnimationFrame(processFrame)
    }

    this.animFrameId = requestAnimationFrame(processFrame)
  }

  /** Stop the processing loop. */
  stop(): void {
    this.running = false
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  /** Stop processing and release the model. */
  destroy(): void {
    this.stop()
    this.landmarker?.close()
    this.landmarker = null
  }
}
```

---

<a id="pushup"></a>
### `src/lib/pose/exercises/pushup.ts`

```ts
/**
 * Push-up rep counter — tracks elbow angle to count reps.
 * Pure logic, no React dependency.
 */
import type { Landmark } from '../landmarks'
import { POSE } from '../landmarks'
import { calculateAngle, smoothAngle, averageLandmarks } from '../angles'
import { RepCounter, type RepPhase } from '../rep-counter'

const PUSHUP_CONFIG = {
  readyAngle: 160,
  bottomAngle: 90,
  hysteresis: 10,
} as const

const SMOOTHING_FACTOR = 0.4

export interface PushupFrameResult {
  angle: number
  repCount: number
  phase: RepPhase
  repCompleted: boolean
}

/**
 * Creates a stateful push-up processor.
 * Call `processFrame()` on each pose detection frame.
 */
export function createPushupProcessor() {
  const counter = new RepCounter(PUSHUP_CONFIG)
  let smoothedAngle = 0
  let initialized = false

  return {
    processFrame(landmarks: Landmark[]): PushupFrameResult {
      const leftShoulder = landmarks[POSE.LEFT_SHOULDER]
      const rightShoulder = landmarks[POSE.RIGHT_SHOULDER]
      const leftElbow = landmarks[POSE.LEFT_ELBOW]
      const rightElbow = landmarks[POSE.RIGHT_ELBOW]
      const leftWrist = landmarks[POSE.LEFT_WRIST]
      const rightWrist = landmarks[POSE.RIGHT_WRIST]

      // Average both sides for robustness
      const shoulder = averageLandmarks(leftShoulder, rightShoulder)
      const elbow = averageLandmarks(leftElbow, rightElbow)
      const wrist = averageLandmarks(leftWrist, rightWrist)

      const rawAngle = calculateAngle(shoulder, elbow, wrist)

      if (!initialized) {
        smoothedAngle = rawAngle
        initialized = true
      } else {
        smoothedAngle = smoothAngle(rawAngle, smoothedAngle, SMOOTHING_FACTOR)
      }

      const result = counter.update(smoothedAngle)

      return {
        angle: smoothedAngle,
        repCount: result.count,
        phase: result.phase,
        repCompleted: result.repCompleted,
      }
    },

    reset() {
      counter.reset()
      smoothedAngle = 0
      initialized = false
    },

    get count() {
      return counter.count
    },
  }
}
```

---

<a id="squat"></a>
### `src/lib/pose/exercises/squat.ts`

```ts
/**
 * Squat rep counter — tracks knee angle to count reps.
 * Pure logic, no React dependency.
 */
import type { Landmark } from '../landmarks'
import { POSE } from '../landmarks'
import { calculateAngle, smoothAngle, averageLandmarks } from '../angles'
import { RepCounter, type RepPhase } from '../rep-counter'

const SQUAT_CONFIG = {
  readyAngle: 160,
  bottomAngle: 90,
  hysteresis: 10,
} as const

const SMOOTHING_FACTOR = 0.4

export interface SquatFrameResult {
  angle: number
  repCount: number
  phase: RepPhase
  repCompleted: boolean
}

/**
 * Creates a stateful squat processor.
 * Call `processFrame()` on each pose detection frame.
 */
export function createSquatProcessor() {
  const counter = new RepCounter(SQUAT_CONFIG)
  let smoothedAngle = 0
  let initialized = false

  return {
    processFrame(landmarks: Landmark[]): SquatFrameResult {
      const leftHip = landmarks[POSE.LEFT_HIP]
      const rightHip = landmarks[POSE.RIGHT_HIP]
      const leftKnee = landmarks[POSE.LEFT_KNEE]
      const rightKnee = landmarks[POSE.RIGHT_KNEE]
      const leftAnkle = landmarks[POSE.LEFT_ANKLE]
      const rightAnkle = landmarks[POSE.RIGHT_ANKLE]

      // Average both sides for robustness
      const hip = averageLandmarks(leftHip, rightHip)
      const knee = averageLandmarks(leftKnee, rightKnee)
      const ankle = averageLandmarks(leftAnkle, rightAnkle)

      const rawAngle = calculateAngle(hip, knee, ankle)

      if (!initialized) {
        smoothedAngle = rawAngle
        initialized = true
      } else {
        smoothedAngle = smoothAngle(rawAngle, smoothedAngle, SMOOTHING_FACTOR)
      }

      const result = counter.update(smoothedAngle)

      return {
        angle: smoothedAngle,
        repCount: result.count,
        phase: result.phase,
        repCompleted: result.repCompleted,
      }
    },

    reset() {
      counter.reset()
      smoothedAngle = 0
      initialized = false
    },

    get count() {
      return counter.count
    },
  }
}
```

---

<a id="plank"></a>
### `src/lib/pose/exercises/plank.ts`

```ts
/**
 * Plank hold timer — detects plank position and tracks hold duration.
 * Pure logic, no React dependency.
 */
import type { Landmark } from '../landmarks'
import { POSE } from '../landmarks'
import { calculateAngle, averageLandmarks } from '../angles'

/** Maximum deviation from 180° (straight line) to count as holding. */
const ALIGNMENT_THRESHOLD = 15

export interface PlankFrameResult {
  /** Whether the user is currently in a valid plank position. */
  isHolding: boolean
  /** Accumulated hold time in milliseconds. */
  holdTimeMs: number
  /** Current shoulder-hip-ankle alignment angle (180° = perfect). */
  alignmentAngle: number
}

/**
 * Creates a stateful plank timer.
 * Call `processFrame()` on each pose detection frame with the time delta.
 */
export function createPlankProcessor() {
  let holdTimeMs = 0
  let isHolding = false

  return {
    processFrame(landmarks: Landmark[], deltaMs: number): PlankFrameResult {
      const shoulder = averageLandmarks(
        landmarks[POSE.LEFT_SHOULDER],
        landmarks[POSE.RIGHT_SHOULDER]
      )
      const hip = averageLandmarks(
        landmarks[POSE.LEFT_HIP],
        landmarks[POSE.RIGHT_HIP]
      )
      const ankle = averageLandmarks(
        landmarks[POSE.LEFT_ANKLE],
        landmarks[POSE.RIGHT_ANKLE]
      )

      // Measure alignment: 180° = perfectly straight body line
      const alignmentAngle = calculateAngle(shoulder, hip, ankle)
      const deviation = Math.abs(180 - alignmentAngle)

      isHolding = deviation <= ALIGNMENT_THRESHOLD

      if (isHolding && deltaMs > 0) {
        holdTimeMs += deltaMs
      }

      return {
        isHolding,
        holdTimeMs,
        alignmentAngle,
      }
    },

    reset() {
      holdTimeMs = 0
      isHolding = false
    },

    get totalHoldMs() {
      return holdTimeMs
    },

    get holding() {
      return isHolding
    },
  }
}
```

---

## 3. Workout Feature

React UI layer — components + state hook.

<a id="useworkoutsession"></a>
### `src/features/workout/useWorkoutSession.ts`

```ts
'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Category, Exercise, ExerciseEntry, WorkoutSession } from '@/types'
import exerciseData from '@/data/exercises.json'

const typedExercises = exerciseData as Exercise[]

export type WorkoutPhase = 'select' | 'workout' | 'result'

interface UseWorkoutSessionOptions {
  /** User's current levels per category. */
  userLevels: Record<Category, number>
}

export interface UseWorkoutSessionReturn {
  phase: WorkoutPhase
  selectedCategory: Category | null
  currentExerciseIndex: number
  currentSet: number
  exercises: Exercise[]
  /** Reps counted per set per exercise: repCounts[exerciseIdx][setIdx]. */
  repCounts: number[][]
  /** Hold times in ms per set per exercise (plank exercises). */
  holdTimes: number[][]

  selectCategory: (cat: Category) => void
  startWorkout: () => void
  recordRep: () => void
  recordHoldTime: (ms: number) => void
  nextSet: () => void
  nextExercise: () => void
  finishWorkout: () => void
  buildSession: () => WorkoutSession
  reset: () => void
}

export function useWorkoutSession({ userLevels }: UseWorkoutSessionOptions): UseWorkoutSessionReturn {
  const [phase, setPhase] = useState<WorkoutPhase>('select')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)
  const [repCounts, setRepCounts] = useState<number[][]>([])
  const [holdTimes, setHoldTimes] = useState<number[][]>([])

  const level = selectedCategory ? userLevels[selectedCategory] : 1

  const exercises = useMemo(
    () => selectedCategory
      ? typedExercises.filter(e => e.category === selectedCategory && e.level === level)
      : [],
    [selectedCategory, level]
  )

  const selectCategory = useCallback((cat: Category) => {
    setSelectedCategory(cat)
  }, [])

  const startWorkout = useCallback(() => {
    if (!exercises.length) return
    // Initialize tracking arrays
    const reps = exercises.map(ex => Array(ex.targetSets).fill(0) as number[])
    const holds = exercises.map(ex => Array(ex.targetSets).fill(0) as number[])
    setRepCounts(reps)
    setHoldTimes(holds)
    setCurrentExerciseIndex(0)
    setCurrentSet(0)
    setPhase('workout')
  }, [exercises])

  const recordRep = useCallback(() => {
    setRepCounts(prev => {
      const next = prev.map(arr => [...arr])
      if (next[currentExerciseIndex]) {
        next[currentExerciseIndex][currentSet]++
      }
      return next
    })
  }, [currentExerciseIndex, currentSet])

  const recordHoldTime = useCallback((ms: number) => {
    setHoldTimes(prev => {
      const next = prev.map(arr => [...arr])
      if (next[currentExerciseIndex]) {
        next[currentExerciseIndex][currentSet] = ms
      }
      return next
    })
  }, [currentExerciseIndex, currentSet])

  const nextSet = useCallback(() => {
    const ex = exercises[currentExerciseIndex]
    if (!ex) return
    if (currentSet < ex.targetSets - 1) {
      setCurrentSet(prev => prev + 1)
    }
  }, [exercises, currentExerciseIndex, currentSet])

  const nextExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSet(0)
    }
  }, [exercises.length, currentExerciseIndex])

  const finishWorkout = useCallback(() => {
    setPhase('result')
  }, [])

  const buildSession = useCallback((): WorkoutSession => {
    const cat = selectedCategory!
    const entries: ExerciseEntry[] = exercises.map((ex, exIdx) => {
      const reps = repCounts[exIdx] ?? []
      const holds = holdTimes[exIdx] ?? []

      // Determine how many sets were actually completed
      const checkedSets = Array(ex.targetSets).fill(false).map((_, setIdx) => {
        if (ex.isHold) {
          return Math.round((holds[setIdx] ?? 0) / 1000) > 0
        }
        return (reps[setIdx] ?? 0) > 0
      })
      const actualSets = checkedSets.filter(Boolean).length

      // Compute hitTarget — same logic as useExerciseForm.buildSession()
      let hitTarget = true
      for (let s = 0; s < checkedSets.length; s++) {
        if (!checkedSets[s]) continue
        if (ex.isHold) {
          if (Math.round((holds[s] ?? 0) / 1000) < (ex.targetHoldSeconds ?? 0)) hitTarget = false
        } else {
          if ((reps[s] ?? 0) < ex.targetReps) hitTarget = false
        }
      }
      if (actualSets < ex.targetSets) hitTarget = false

      return {
        exerciseId: ex.id,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        actualSets,
        actualReps: reps,
        actualHoldSeconds: ex.isHold
          ? holds.map(ms => Math.round(ms / 1000))
          : undefined,
        checkedSets,
        hitTarget,
      }
    })

    return {
      id: `${cat}-${level}-${Date.now()}`,
      date: new Date().toISOString(),
      level,
      category: cat,
      exercises: entries,
    }
  }, [selectedCategory, level, exercises, repCounts, holdTimes])

  const reset = useCallback(() => {
    setPhase('select')
    setSelectedCategory(null)
    setCurrentExerciseIndex(0)
    setCurrentSet(0)
    setRepCounts([])
    setHoldTimes([])
  }, [])

  return {
    phase,
    selectedCategory,
    currentExerciseIndex,
    currentSet,
    exercises,
    repCounts,
    holdTimes,
    selectCategory,
    startWorkout,
    recordRep,
    recordHoldTime,
    nextSet,
    nextExercise,
    finishWorkout,
    buildSession,
    reset,
  }
}
```

---

<a id="workoutview"></a>
### `src/features/workout/WorkoutView.tsx`

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { useGameState } from '@/hooks/useGameState'
import type { Category } from '@/types'
import type { LogSessionResult } from '@/hooks/useGameState'
import type { Landmark } from '@/lib/pose/landmarks'
import { createPushupProcessor } from '@/lib/pose/exercises/pushup'
import { createSquatProcessor } from '@/lib/pose/exercises/squat'
import { createPlankProcessor } from '@/lib/pose/exercises/plank'
import { GatePassedModal } from '@/components/GatePassedModal'
import { ExerciseSelector } from './ExerciseSelector'
import { CameraView } from './CameraView'
import { WorkoutHUD } from './WorkoutHUD'
import { WorkoutResult } from './WorkoutResult'
import { useWorkoutSession } from './useWorkoutSession'
import './workout.css'

type ExerciseProcessor = ReturnType<typeof createPushupProcessor>
  | ReturnType<typeof createSquatProcessor>
type PlankProcessorType = ReturnType<typeof createPlankProcessor>

export function WorkoutView() {
  const {
    status, user, categoryDoneThisWeek, logSession,
  } = useGameState()

  const workoutSession = useWorkoutSession({
    userLevels: user?.levels ?? { push: 1, pull: 1, squat: 1 },
  })

  const [result, setResult] = useState<LogSessionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [levelUpInfo, setLevelUpInfo] = useState<{
    category: Category; oldLevel: number; newLevel: number
  } | null>(null)

  // Processor refs — created when workout starts, reset between exercises
  const repProcessorRef = useRef<ExerciseProcessor | null>(null)
  const plankProcessorRef = useRef<PlankProcessorType | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  const currentExercise = workoutSession.exercises[workoutSession.currentExerciseIndex]
  const isHold = currentExercise?.isHold ?? false

  // Create/reset processor when exercise changes
  const ensureProcessor = useCallback((cat: Category) => {
    if (isHold) {
      if (!plankProcessorRef.current) {
        plankProcessorRef.current = createPlankProcessor()
      }
      repProcessorRef.current = null
    } else {
      if (cat === 'squat') {
        repProcessorRef.current = createSquatProcessor()
      } else {
        repProcessorRef.current = createPushupProcessor()
      }
      plankProcessorRef.current = null
    }
    lastFrameTimeRef.current = 0
  }, [isHold])

  const handleSelectCategory = useCallback((cat: Category) => {
    workoutSession.selectCategory(cat)
    workoutSession.startWorkout()
    ensureProcessor(cat)
  }, [workoutSession, ensureProcessor])

  const handleLandmarks = useCallback((landmarks: Landmark[]) => {
    if (!currentExercise) return

    const now = performance.now()

    if (isHold && plankProcessorRef.current) {
      const deltaMs = lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 0
      lastFrameTimeRef.current = now

      const plankResult = plankProcessorRef.current.processFrame(landmarks, deltaMs)
      workoutSession.recordHoldTime(plankResult.holdTimeMs)
    } else if (repProcessorRef.current) {
      const frameResult = repProcessorRef.current.processFrame(landmarks)
      if (frameResult.repCompleted) {
        workoutSession.recordRep()
      }
    }
  }, [currentExercise, isHold, workoutSession])

  const handleNextSet = useCallback(() => {
    workoutSession.nextSet()
    // Reset processor for next set
    repProcessorRef.current?.reset()
    plankProcessorRef.current?.reset()
    lastFrameTimeRef.current = 0
  }, [workoutSession])

  const handleNextExercise = useCallback(() => {
    workoutSession.nextExercise()
    // Processor will be recreated for next exercise type
    repProcessorRef.current = null
    plankProcessorRef.current = null
    lastFrameTimeRef.current = 0

    // Need to create a new processor for the next exercise
    const nextIdx = workoutSession.currentExerciseIndex + 1
    const nextEx = workoutSession.exercises[nextIdx]
    if (nextEx && workoutSession.selectedCategory) {
      if (nextEx.isHold) {
        plankProcessorRef.current = createPlankProcessor()
      } else if (workoutSession.selectedCategory === 'squat') {
        repProcessorRef.current = createSquatProcessor()
      } else {
        repProcessorRef.current = createPushupProcessor()
      }
    }
  }, [workoutSession])

  const handleFinish = useCallback(async () => {
    setSaving(true)
    try {
      const session = workoutSession.buildSession()
      const res = await logSession(session)
      setResult(res)
      workoutSession.finishWorkout()

      if (res.leveledUp && res.newLevel) {
        setLevelUpInfo({
          category: session.category,
          oldLevel: session.level,
          newLevel: res.newLevel,
        })
      }
    } catch {
      // If save fails, still show result phase
      workoutSession.finishWorkout()
    } finally {
      setSaving(false)
    }
  }, [workoutSession, logSession])

  const handleDone = useCallback(() => {
    workoutSession.reset()
    setResult(null)
    repProcessorRef.current = null
    plankProcessorRef.current = null
  }, [workoutSession])

  if (status === 'loading') {
    return <div className="loading-state">Loading...</div>
  }

  if (!user) {
    return <div className="loading-state">No data</div>
  }

  return (
    <div className="workout-view">
      {/* Phase: Select category */}
      {workoutSession.phase === 'select' && (
        <ExerciseSelector
          userLevels={user.levels}
          categoryDoneThisWeek={categoryDoneThisWeek}
          onSelect={handleSelectCategory}
        />
      )}

      {/* Phase: Active workout */}
      {workoutSession.phase === 'workout' && currentExercise && workoutSession.selectedCategory && (
        <CameraView onLandmarks={handleLandmarks}>
          <WorkoutHUD
            category={workoutSession.selectedCategory}
            level={user.levels[workoutSession.selectedCategory]}
            exercise={currentExercise}
            currentSet={workoutSession.currentSet}
            repCount={
              workoutSession.repCounts[workoutSession.currentExerciseIndex]?.[workoutSession.currentSet] ?? 0
            }
            holdTimeMs={
              workoutSession.holdTimes[workoutSession.currentExerciseIndex]?.[workoutSession.currentSet] ?? 0
            }
            isHolding={plankProcessorRef.current?.holding ?? false}
            isLastSet={workoutSession.currentSet >= currentExercise.targetSets - 1}
            isLastExercise={workoutSession.currentExerciseIndex >= workoutSession.exercises.length - 1}
            onNextSet={handleNextSet}
            onNextExercise={handleNextExercise}
            onFinish={handleFinish}
          />
        </CameraView>
      )}

      {/* Phase: Result */}
      {workoutSession.phase === 'result' && result && (
        <WorkoutResult
          result={result}
          exercises={workoutSession.exercises}
          repCounts={workoutSession.repCounts}
          holdTimes={workoutSession.holdTimes}
          onDone={handleDone}
        />
      )}

      {/* Saving overlay */}
      {saving && (
        <div className="loading-state" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}>
          Saving session...
        </div>
      )}

      {/* Level up modal */}
      {levelUpInfo && (
        <GatePassedModal
          category={levelUpInfo.category}
          oldLevel={levelUpInfo.oldLevel}
          newLevel={levelUpInfo.newLevel}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  )
}
```

---

<a id="cameraview"></a>
### `src/features/workout/CameraView.tsx`

```tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Landmark } from '@/lib/pose/landmarks'
import { PoseDetector } from '@/lib/pose/mediapipe'
import { SkeletonOverlay } from './SkeletonOverlay'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CameraViewProps {
  /** Called on each frame with detected pose landmarks. */
  onLandmarks: (landmarks: Landmark[]) => void
  children?: React.ReactNode
}

type CameraState = 'loading' | 'ready' | 'denied' | 'error'

export function CameraView({ onLandmarks, children }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onLandmarksRef = useRef(onLandmarks)
  onLandmarksRef.current = onLandmarks

  const [cameraState, setCameraState] = useState<CameraState>('loading')
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [dimensions, setDimensions] = useState({ width: 480, height: 640 })
  const [confidence, setConfidence] = useState(0)

  const handleLandmarks = useCallback((lms: Landmark[]) => {
    setLandmarks(lms)
    onLandmarksRef.current(lms)

    // Calculate average visibility for confidence indicator
    if (lms.length > 0) {
      const avg = lms.reduce((sum, lm) => sum + lm.visibility, 0) / lms.length
      setConfidence(avg)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await video.play()

        // Get actual video dimensions
        const vw = video.videoWidth || 640
        const vh = video.videoHeight || 480
        setDimensions({ width: vw, height: vh })

        // Initialize pose detector
        const detector = await PoseDetector.create({
          onResults: handleLandmarks,
          onError: (err) => console.warn('[CameraView] pose error:', err),
        })

        if (cancelled) {
          detector.destroy()
          return
        }

        detectorRef.current = detector
        detector.start(video)
        setCameraState('ready')
      } catch (err) {
        if (cancelled) return
        const error = err as Error
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraState('denied')
        } else {
          setCameraState('error')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      detectorRef.current?.destroy()
      detectorRef.current = null
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [handleLandmarks])

  // Update container dimensions on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (cameraState === 'denied') {
    return (
      <div className="camera-view">
        <div className="camera-view__error">
          <p className="camera-view__error-title">Camera Access Denied</p>
          <p className="camera-view__error-msg">
            Camera access is needed for automatic rep counting.
            Please enable camera permissions in your browser settings.
          </p>
          <Link href="/" className="camera-view__error-link">
            Log manually on Home instead
          </Link>
        </div>
      </div>
    )
  }

  if (cameraState === 'error') {
    return (
      <div className="camera-view">
        <div className="camera-view__error">
          <p className="camera-view__error-title">Camera Error</p>
          <p className="camera-view__error-msg">
            Could not access camera or load pose detection model.
          </p>
          <Link href="/" className="camera-view__error-link">
            Log manually on Home instead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="camera-view">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-view__video"
      />

      {cameraState === 'loading' && (
        <div className="camera-view__loading">
          <p>Starting camera...</p>
          <p>Loading pose detection model</p>
        </div>
      )}

      {cameraState === 'ready' && landmarks.length > 0 && (
        <SkeletonOverlay
          landmarks={landmarks}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {cameraState === 'ready' && (
        <span className={cn(
          'camera-view__confidence',
          confidence > 0.6 ? 'camera-view__confidence--good' : 'camera-view__confidence--low'
        )}>
          {Math.round(confidence * 100)}%
        </span>
      )}

      {children}
    </div>
  )
}
```

---

<a id="skeletonoverlay"></a>
### `src/features/workout/SkeletonOverlay.tsx`

```tsx
'use client'

import { useRef, useEffect } from 'react'
import type { Landmark } from '@/lib/pose/landmarks'
import { SKELETON_CONNECTIONS } from '@/lib/pose/landmarks'

interface SkeletonOverlayProps {
  landmarks: Landmark[]
  width: number
  height: number
}

const LANDMARK_RADIUS = 4
const LINE_WIDTH = 2
const GOOD_VISIBILITY = 0.6

export function SkeletonOverlay({ landmarks, width, height }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !landmarks.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

    // Draw connections
    for (const [from, to] of SKELETON_CONNECTIONS) {
      const a = landmarks[from]
      const b = landmarks[to]
      if (!a || !b) continue

      const visible = a.visibility > GOOD_VISIBILITY && b.visibility > GOOD_VISIBILITY
      ctx.beginPath()
      ctx.moveTo(a.x * width, a.y * height)
      ctx.lineTo(b.x * width, b.y * height)
      ctx.strokeStyle = visible ? 'rgba(0, 229, 255, 0.7)' : 'rgba(107, 138, 171, 0.3)'
      ctx.lineWidth = LINE_WIDTH
      ctx.stroke()
    }

    // Draw landmarks
    for (const lm of landmarks) {
      const visible = lm.visibility > GOOD_VISIBILITY
      ctx.beginPath()
      ctx.arc(lm.x * width, lm.y * height, LANDMARK_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = visible ? '#00e5ff' : 'rgba(107, 138, 171, 0.4)'
      ctx.fill()
    }
  }, [landmarks, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="camera-view__canvas"
      style={{ width, height }}
    />
  )
}
```

---

<a id="workouthud"></a>
### `src/features/workout/WorkoutHUD.tsx`

```tsx
'use client'

import type { Category, Exercise } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { cn } from '@/lib/utils'

interface WorkoutHUDProps {
  category: Category
  level: number
  exercise: Exercise
  currentSet: number
  repCount: number
  /** Hold time in ms for plank exercises. */
  holdTimeMs: number
  /** Whether the plank position is currently being held. */
  isHolding: boolean
  isLastSet: boolean
  isLastExercise: boolean
  onNextSet: () => void
  onNextExercise: () => void
  onFinish: () => void
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function WorkoutHUD({
  category,
  level,
  exercise,
  currentSet,
  repCount,
  holdTimeMs,
  isHolding,
  isLastSet,
  isLastExercise,
  onNextSet,
  onNextExercise,
  onFinish,
}: WorkoutHUDProps) {
  const isHold = exercise.isHold

  return (
    <div className="workout-hud">
      <div className="workout-hud__exercise-info">
        <CategoryBadge category={category} />
        <span className="workout-hud__exercise-name">{exercise.name}</span>
      </div>

      {isHold ? (
        <>
          <span className="workout-hud__timer">{formatTime(holdTimeMs)}</span>
          <span className={cn(
            'workout-hud__holding',
            isHolding ? 'workout-hud__holding--active' : 'workout-hud__holding--broken'
          )}>
            {isHolding ? 'Holding' : 'Position lost'}
          </span>
          <span className="workout-hud__target">
            Target: {exercise.targetHoldSeconds}s
          </span>
        </>
      ) : (
        <>
          <span className="workout-hud__count">{repCount}</span>
          <span className="workout-hud__target">
            Target: {exercise.targetReps} reps
          </span>
        </>
      )}

      <div className="workout-hud__set-info">
        <span>Set {currentSet + 1} / {exercise.targetSets}</span>
        <span>L{level}</span>
      </div>

      <div className="workout-hud__controls">
        {!isLastSet ? (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--primary"
            onClick={onNextSet}
          >
            Next Set
          </button>
        ) : !isLastExercise ? (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--primary"
            onClick={onNextExercise}
          >
            Next Exercise
          </button>
        ) : (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--finish"
            onClick={onFinish}
          >
            Finish Workout
          </button>
        )}

        {/* Allow skipping to finish at any time */}
        {!(isLastSet && isLastExercise) && (
          <button
            type="button"
            className="workout-hud__btn workout-hud__btn--secondary"
            onClick={onFinish}
          >
            Finish Early
          </button>
        )}
      </div>
    </div>
  )
}
```

---

<a id="workoutresult"></a>
### `src/features/workout/WorkoutResult.tsx`

```tsx
'use client'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { getCompletionMessage } from '@/lib/session-helpers'
import { cn } from '@/lib/utils'
import type { LogSessionResult } from '@/hooks/useGameState'
import type { Exercise } from '@/types'

interface WorkoutResultProps {
  result: LogSessionResult
  exercises: Exercise[]
  repCounts: number[][]
  holdTimes: number[][]
  onDone: () => void
}

export function WorkoutResult({
  result,
  exercises,
  repCounts,
  holdTimes,
  onDone,
}: WorkoutResultProps) {
  const { sessionResult, gateProgress: gate } = result
  const pct = sessionResult.completionPct
  const message = getCompletionMessage(pct)

  return (
    <div className="workout-result">
      <div className="workout-result__header">
        <h2 className="workout-result__title">Workout Complete</h2>
        <p className="workout-result__pct">{pct}%</p>
        <ProgressBar
          value={pct}
          color={pct === 100 ? 'emerald' : pct >= 75 ? 'cyan' : 'amber'}
        />
        <p className="workout-result__msg">{message}</p>
      </div>

      <div className="workout-result__gate">
        <span className="workout-result__gate-text">
          {gate.status === 'passed'
            ? 'Gate cleared!'
            : `${gate.consecutivePasses}/3 clean sessions`}
        </span>
        {sessionResult.isClean && gate.status !== 'passed' && (
          <span className="workout-result__clean-badge">Clean</span>
        )}
      </div>

      <div className="workout-result__exercises">
        {exercises.map((ex, exIdx) => {
          const reps = repCounts[exIdx] ?? []
          const holds = holdTimes[exIdx] ?? []
          const gatResult = sessionResult.exerciseResults.find(r => r.exerciseId === ex.id)
          const met = gatResult?.met ?? false

          return (
            <div key={ex.id} className="workout-result__ex-row">
              <div className="workout-result__ex-header">
                <span className="workout-result__ex-name">{ex.name}</span>
                <span className={cn(
                  'workout-result__ex-status',
                  met ? 'workout-result__ex-status--met' : 'workout-result__ex-status--unmet'
                )}>
                  {met ? 'Met' : 'Not met'}
                </span>
              </div>
              <ProgressBar
                value={gatResult ? Math.round(
                  (gatResult.actualCheckedSets / gatResult.targetSets) * 100
                ) : 0}
                color={met ? 'emerald' : 'muted'}
              />
              <div className="workout-result__ex-sets">
                {Array.from({ length: ex.targetSets }).map((_, setIdx) => (
                  <span key={setIdx}>
                    S{setIdx + 1}:{' '}
                    {ex.isHold
                      ? `${Math.round((holds[setIdx] ?? 0) / 1000)}s/${ex.targetHoldSeconds}s`
                      : `${reps[setIdx] ?? 0}/${ex.targetReps}`
                    }
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={onDone} className="btn-primary">
        Done
      </button>
    </div>
  )
}
```

---

<a id="exerciseselector"></a>
### `src/features/workout/ExerciseSelector.tsx`

```tsx
'use client'

import type { Category } from '@/types'
import { CATEGORIES } from '@/types'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { GlowCard } from '@/components/ui/GlowCard'
import { LEVEL_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types'
import exerciseData from '@/data/exercises.json'

const typedExercises = exerciseData as Exercise[]

interface ExerciseSelectorProps {
  userLevels: Record<Category, number>
  categoryDoneThisWeek: Record<Category, boolean>
  onSelect: (category: Category) => void
}

export function ExerciseSelector({
  userLevels,
  categoryDoneThisWeek,
  onSelect,
}: ExerciseSelectorProps) {
  return (
    <div className="exercise-selector">
      <div className="exercise-selector__header">
        <h1 className="exercise-selector__title">Camera Workout</h1>
        <p className="exercise-selector__subtitle">
          Select a category to start tracking with your camera
        </p>
      </div>

      {CATEGORIES.map(cat => {
        const done = categoryDoneThisWeek[cat]
        const level = userLevels[cat]
        const exerciseCount = typedExercises.filter(
          e => e.category === cat && e.level === level
        ).length

        return (
          <GlowCard
            key={cat}
            glow={done ? 'none' : cat}
            className={cn(
              'exercise-selector__card',
              done && 'exercise-selector__card--dimmed'
            )}
          >
            <button
              type="button"
              className="exercise-selector__card-btn"
              onClick={() => onSelect(cat)}
              disabled={done}
            >
              <div className="exercise-selector__card-info">
                <CategoryBadge category={cat} />
                <div>
                  <p className="exercise-selector__card-level">
                    Level {level}
                    <span className="exercise-selector__card-level-name">
                      {LEVEL_NAMES[level] ?? ''}
                    </span>
                  </p>
                  {done ? (
                    <p className="exercise-selector__done-text">Done this week</p>
                  ) : (
                    <p className="exercise-selector__card-exercises">
                      {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              {!done && (
                <span className="exercise-selector__card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
            </button>
          </GlowCard>
        )
      })}
    </div>
  )
}
```

---

<a id="workoutcss"></a>
### `src/features/workout/workout.css`

```css
/* ── Block: workout-view ── */

.workout-view {
  @apply flex min-h-[calc(100vh-8rem)] flex-col;
}

.workout-view__title {
  @apply text-lg font-bold tracking-wide text-tron-text;
}

/* ── Block: exercise-selector ── */

.exercise-selector {
  @apply space-y-3 px-4 py-6;
}

.exercise-selector__header {
  @apply mb-4;
}

.exercise-selector__title {
  @apply text-lg font-bold tracking-wide text-tron-text;
}

.exercise-selector__subtitle {
  @apply text-sm text-tron-muted mt-1;
}

.exercise-selector__card {
  @apply p-4;
}

.exercise-selector__card-btn {
  @apply flex w-full items-center justify-between text-left;
}

.exercise-selector__card-info {
  @apply flex items-center gap-3;
}

.exercise-selector__card-level {
  @apply text-sm font-medium text-tron-text;
}

.exercise-selector__card-level-name {
  @apply ml-1 text-xs text-tron-muted;
}

.exercise-selector__card-exercises {
  @apply text-xs text-tron-muted mt-0.5;
}

.exercise-selector__card-arrow {
  @apply text-tron-muted;
}

.exercise-selector__card--dimmed {
  @apply opacity-40 pointer-events-none;
}

.exercise-selector__done-text {
  @apply text-xs text-tron-success;
}

/* ── Block: camera-view ── */

.camera-view {
  @apply relative flex-1 overflow-hidden bg-black;
}

.camera-view__video {
  @apply h-full w-full object-cover;
}

.camera-view__canvas {
  @apply absolute inset-0 h-full w-full;
}

.camera-view__loading {
  @apply absolute inset-0 flex flex-col items-center justify-center gap-3
         bg-tron-bg text-tron-muted text-sm font-mono;
}

.camera-view__error {
  @apply absolute inset-0 flex flex-col items-center justify-center gap-4
         bg-tron-bg px-6 text-center;
}

.camera-view__error-title {
  @apply text-sm font-semibold text-tron-danger;
}

.camera-view__error-msg {
  @apply text-xs text-tron-muted;
}

.camera-view__error-link {
  @apply text-xs text-tron-primary underline;
}

.camera-view__confidence {
  @apply absolute top-3 right-3 rounded-full px-2 py-0.5
         text-[10px] font-mono backdrop-blur-sm;
}

.camera-view__confidence--good {
  @apply bg-tron-success/20 text-tron-success;
}

.camera-view__confidence--low {
  @apply bg-tron-warning/20 text-tron-warning;
}

/* ── Block: workout-hud ── */

.workout-hud {
  @apply absolute inset-x-0 bottom-0 flex flex-col items-center gap-2
         bg-gradient-to-t from-black/90 via-black/60 to-transparent
         px-4 pb-6 pt-12;
}

.workout-hud__exercise-info {
  @apply flex items-center gap-2 text-xs;
}

.workout-hud__exercise-name {
  @apply text-sm font-semibold text-tron-text;
}

.workout-hud__count {
  @apply text-6xl font-bold font-mono text-tron-primary tabular-nums;
}

.workout-hud__timer {
  @apply text-5xl font-bold font-mono text-tron-primary tabular-nums;
}

.workout-hud__set-info {
  @apply flex items-center gap-3 text-sm text-tron-muted;
}

.workout-hud__target {
  @apply text-xs text-tron-muted font-mono;
}

.workout-hud__controls {
  @apply mt-2 flex items-center gap-3;
}

.workout-hud__btn {
  @apply rounded-lg border px-4 py-2 text-xs font-semibold transition-colors;
}

.workout-hud__btn--primary {
  @apply border-tron-primary/30 bg-tron-primary-dim text-tron-primary
         hover:bg-tron-primary/20;
}

.workout-hud__btn--secondary {
  @apply border-tron-border bg-tron-surface text-tron-muted hover:text-tron-text;
}

.workout-hud__btn--finish {
  @apply border-tron-success/30 bg-tron-success-dim text-tron-success
         hover:bg-tron-success/20;
}

.workout-hud__holding {
  @apply text-xs font-mono;
}

.workout-hud__holding--active {
  @apply text-tron-success;
}

.workout-hud__holding--broken {
  @apply text-tron-warning;
}

/* ── Block: workout-result ── */

.workout-result {
  @apply space-y-4 px-4 py-6;
}

.workout-result__header {
  @apply space-y-2 text-center;
}

.workout-result__title {
  @apply text-xs font-semibold tracking-widest text-tron-muted uppercase;
}

.workout-result__pct {
  @apply text-4xl font-bold font-mono text-tron-primary;
}

.workout-result__msg {
  @apply text-sm text-tron-muted;
}

.workout-result__gate {
  @apply flex items-center justify-center gap-2 rounded-lg border
         border-tron-border bg-tron-surface px-4 py-2;
}

.workout-result__gate-text {
  @apply text-sm text-tron-text;
}

.workout-result__clean-badge {
  @apply rounded-full bg-tron-success-dim px-2 py-0.5 text-[10px]
         font-semibold text-tron-success;
}

.workout-result__exercises {
  @apply space-y-3;
}

.workout-result__ex-row {
  @apply space-y-1;
}

.workout-result__ex-header {
  @apply flex items-center justify-between;
}

.workout-result__ex-name {
  @apply text-sm text-tron-text;
}

.workout-result__ex-status {
  @apply text-xs font-mono;
}

.workout-result__ex-status--met {
  @apply text-tron-success;
}

.workout-result__ex-status--unmet {
  @apply text-tron-muted;
}

.workout-result__ex-sets {
  @apply flex gap-2 text-[10px] font-mono text-tron-muted;
}
```

---

<a id="barrel"></a>
### `src/features/workout/index.ts`

```ts
export { WorkoutView } from './WorkoutView'
```

---

## 4. Routing & Nav

<a id="workout-page"></a>
### `src/app/workout/page.tsx` (new)

```tsx
import { WorkoutView } from '@/features/workout'

export default function WorkoutPage() {
  return <WorkoutView />
}
```

<a id="bottomnav"></a>
### `src/components/layout/BottomNav.tsx` (modified — added 4th tab)

```diff
 const tabs = [
   { href: '/', label: 'Home', icon: HomeIcon },
+  { href: '/workout', label: 'Workout', icon: WorkoutIcon },
   { href: '/tree', label: 'Tree', icon: TreeIcon },
   { href: '/history', label: 'History', icon: HistoryIcon },
 ] as const

+function WorkoutIcon({ active }: { active: boolean }) {
+  return (
+    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
+         strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
+      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
+      <circle cx="12" cy="13" r="4" />
+    </svg>
+  )
+}
```

---

## 5. Tests

26 new tests across 3 files. All pure logic — no React/DOM needed.

<a id="angles-tests"></a>
### `src/lib/pose/__tests__/angles.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { calculateAngle, smoothAngle, averageLandmarks } from '../angles'
import type { Landmark } from '../landmarks'

function lm(x: number, y: number, z = 0, visibility = 1): Landmark {
  return { x, y, z, visibility }
}

describe('calculateAngle', () => {
  it('returns 90° for a right angle', () => {
    const a = lm(0, 1)
    const b = lm(0, 0) // vertex
    const c = lm(1, 0)
    expect(calculateAngle(a, b, c)).toBeCloseTo(90, 0)
  })

  it('returns 180° for a straight line', () => {
    const a = lm(0, 0)
    const b = lm(0.5, 0)
    const c = lm(1, 0)
    expect(calculateAngle(a, b, c)).toBeCloseTo(180, 0)
  })

  it('returns 0° when two segments overlap', () => {
    const a = lm(1, 0)
    const b = lm(0, 0)
    const c = lm(1, 0) // same direction as a
    expect(calculateAngle(a, b, c)).toBeCloseTo(0, 0)
  })

  it('returns 0° when a point coincides with the vertex', () => {
    const a = lm(0, 0)
    const b = lm(0, 0)
    const c = lm(1, 0)
    expect(calculateAngle(a, b, c)).toBe(0)
  })

  it('handles a 45° angle', () => {
    const a = lm(1, 0)
    const b = lm(0, 0)
    const c = lm(1, 1)
    expect(calculateAngle(a, b, c)).toBeCloseTo(45, 0)
  })

  it('handles a 120° angle', () => {
    const a = lm(1, 0)
    const b = lm(0, 0)
    const c = lm(-0.5, Math.sqrt(3) / 2)
    expect(calculateAngle(a, b, c)).toBeCloseTo(120, 0)
  })
})

describe('smoothAngle', () => {
  it('returns weighted average', () => {
    expect(smoothAngle(100, 80, 0.5)).toBe(90)
  })

  it('with factor 0 returns previous value', () => {
    expect(smoothAngle(100, 80, 0)).toBe(80)
  })

  it('with factor 1 returns current value', () => {
    expect(smoothAngle(100, 80, 1)).toBe(100)
  })
})

describe('averageLandmarks', () => {
  it('averages coordinates', () => {
    const a = lm(0, 0, 0, 0.8)
    const b = lm(1, 1, 1, 1.0)
    const avg = averageLandmarks(a, b)
    expect(avg.x).toBe(0.5)
    expect(avg.y).toBe(0.5)
    expect(avg.z).toBe(0.5)
  })

  it('uses minimum visibility', () => {
    const a = lm(0, 0, 0, 0.3)
    const b = lm(1, 1, 1, 0.9)
    expect(averageLandmarks(a, b).visibility).toBe(0.3)
  })
})
```

---

<a id="rep-counter-tests"></a>
### `src/lib/pose/__tests__/rep-counter.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { RepCounter } from '../rep-counter'

const CONFIG = {
  readyAngle: 160,
  bottomAngle: 90,
  hysteresis: 10,
}

describe('RepCounter', () => {
  let counter: RepCounter

  beforeEach(() => {
    counter = new RepCounter(CONFIG)
  })

  it('starts in idle phase with 0 count', () => {
    expect(counter.phase).toBe('idle')
    expect(counter.count).toBe(0)
  })

  it('transitions from idle to ready when angle is near ready', () => {
    counter.update(165) // above readyAngle - hysteresis (150)
    expect(counter.phase).toBe('ready')
  })

  it('stays in idle when angle is too low', () => {
    counter.update(100)
    expect(counter.phase).toBe('idle')
  })

  it('completes a full rep cycle', () => {
    // idle → ready
    counter.update(165)
    expect(counter.phase).toBe('ready')

    // ready → down
    counter.update(140) // below readyAngle - hysteresis (150)
    expect(counter.phase).toBe('down')

    // down → bottom
    counter.update(95) // within bottomAngle + hysteresis (100)
    expect(counter.phase).toBe('bottom')

    // bottom → up
    counter.update(120) // above bottomAngle + hysteresis (100)
    expect(counter.phase).toBe('up')

    // up → ready (rep completed)
    const result = counter.update(155) // above readyAngle - hysteresis (150)
    expect(result.repCompleted).toBe(true)
    expect(counter.phase).toBe('ready')
    expect(counter.count).toBe(1)
  })

  it('counts multiple reps', () => {
    // First rep
    counter.update(165) // idle → ready
    counter.update(140) // ready → down
    counter.update(85)  // down → bottom
    counter.update(130) // bottom → up
    counter.update(160) // up → ready (count: 1)

    // Second rep
    counter.update(140) // ready → down
    counter.update(80)  // down → bottom
    counter.update(120) // bottom → up
    counter.update(160) // up → ready (count: 2)

    expect(counter.count).toBe(2)
  })

  it('resets from down to ready if angle goes back up without reaching bottom', () => {
    counter.update(165) // idle → ready
    counter.update(140) // ready → down
    counter.update(165) // goes back up → ready (no count)
    expect(counter.phase).toBe('ready')
    expect(counter.count).toBe(0)
  })

  it('goes back to bottom from up if angle drops again', () => {
    counter.update(165) // idle → ready
    counter.update(140) // ready → down
    counter.update(90)  // down → bottom
    counter.update(120) // bottom → up
    counter.update(85)  // up → back to bottom
    expect(counter.phase).toBe('bottom')
    expect(counter.count).toBe(0)
  })

  it('reset() clears state', () => {
    counter.update(165)
    counter.update(140)
    counter.update(85)
    counter.update(130)
    counter.update(160) // 1 rep

    counter.reset()
    expect(counter.phase).toBe('idle')
    expect(counter.count).toBe(0)
  })

  it('returns phaseChanged=true only when phase changes', () => {
    const r1 = counter.update(165) // idle → ready
    expect(r1.phaseChanged).toBe(true)

    const r2 = counter.update(165) // still ready
    expect(r2.phaseChanged).toBe(false)
  })
})
```

---

<a id="plank-tests"></a>
### `src/lib/pose/__tests__/plank.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPlankProcessor } from '../exercises/plank'
import type { Landmark } from '../landmarks'

/**
 * Build a fake landmarks array with only the required landmarks set.
 * Shoulder-hip-ankle alignment determines hold detection.
 */
function makeLandmarks(
  shoulderY: number,
  hipY: number,
  ankleY: number
): Landmark[] {
  const lms: Landmark[] = Array(33).fill(null).map(() => ({
    x: 0.5, y: 0.5, z: 0, visibility: 1,
  }))

  // Left/right shoulders (indices 11, 12)
  lms[11] = { x: 0.3, y: shoulderY, z: 0, visibility: 1 }
  lms[12] = { x: 0.7, y: shoulderY, z: 0, visibility: 1 }

  // Left/right hips (indices 23, 24)
  lms[23] = { x: 0.3, y: hipY, z: 0, visibility: 1 }
  lms[24] = { x: 0.7, y: hipY, z: 0, visibility: 1 }

  // Left/right ankles (indices 27, 28)
  lms[27] = { x: 0.3, y: ankleY, z: 0, visibility: 1 }
  lms[28] = { x: 0.7, y: ankleY, z: 0, visibility: 1 }

  return lms
}

describe('PlankProcessor', () => {
  let processor: ReturnType<typeof createPlankProcessor>

  beforeEach(() => {
    processor = createPlankProcessor()
  })

  it('detects a straight plank position (180° alignment)', () => {
    // Shoulder, hip, ankle all at same y = perfectly straight
    const lms = makeLandmarks(0.3, 0.5, 0.7)
    const result = processor.processFrame(lms, 100)
    expect(result.isHolding).toBe(true)
    expect(result.holdTimeMs).toBe(100)
  })

  it('does not count time when position is broken (sagging hips)', () => {
    // Hip much lower than shoulder-ankle line → >15° deviation
    const lms = makeLandmarks(0.3, 0.9, 0.7)
    const result = processor.processFrame(lms, 100)
    expect(result.isHolding).toBe(false)
    expect(result.holdTimeMs).toBe(0)
  })

  it('accumulates hold time across frames', () => {
    const goodPos = makeLandmarks(0.3, 0.5, 0.7)
    processor.processFrame(goodPos, 100)
    processor.processFrame(goodPos, 100)
    const result = processor.processFrame(goodPos, 100)
    expect(result.holdTimeMs).toBe(300)
  })

  it('pauses timer when position breaks, resumes when restored', () => {
    const goodPos = makeLandmarks(0.3, 0.5, 0.7)
    const badPos = makeLandmarks(0.3, 0.9, 0.7)

    processor.processFrame(goodPos, 100) // 100ms
    processor.processFrame(goodPos, 100) // 200ms
    processor.processFrame(badPos, 100)  // broken, still 200ms
    processor.processFrame(badPos, 100)  // still 200ms
    const result = processor.processFrame(goodPos, 100) // 300ms
    expect(result.holdTimeMs).toBe(300)
  })

  it('reset() clears all state', () => {
    const goodPos = makeLandmarks(0.3, 0.5, 0.7)
    processor.processFrame(goodPos, 500)
    expect(processor.totalHoldMs).toBe(500)

    processor.reset()
    expect(processor.totalHoldMs).toBe(0)
    expect(processor.holding).toBe(false)
  })

  it('does not count time with deltaMs=0', () => {
    const goodPos = makeLandmarks(0.3, 0.5, 0.7)
    const result = processor.processFrame(goodPos, 0)
    expect(result.isHolding).toBe(true)
    expect(result.holdTimeMs).toBe(0)
  })
})
```
