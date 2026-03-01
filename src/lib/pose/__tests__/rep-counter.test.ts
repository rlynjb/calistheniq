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
