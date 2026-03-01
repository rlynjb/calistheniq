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
