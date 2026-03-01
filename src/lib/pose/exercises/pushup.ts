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
