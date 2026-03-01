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
