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
