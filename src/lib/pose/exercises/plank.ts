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
