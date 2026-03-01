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
