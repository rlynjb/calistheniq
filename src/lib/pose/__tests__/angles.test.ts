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
