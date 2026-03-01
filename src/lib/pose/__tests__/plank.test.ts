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
