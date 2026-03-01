/**
 * @file Session result display helpers — generates human-readable
 * gap text and motivational messages for the post-save result view.
 *
 * @description
 * Pure utility functions with no side effects. Used exclusively by
 * {@link SessionResult} to translate raw exercise result data into
 * user-facing strings.
 *
 * @see {@link SessionResult} for the component that renders these strings
 * @see {@link SessionResult} type from gate-check for the input data shape
 */
import type { SessionResult } from '@/lib/game/gate-check'

/** Single exercise result extracted from {@link SessionResult.exerciseResults}. */
type ExerciseResult = SessionResult['exerciseResults'][number]

/**
 * Generates a human-readable shortfall description for an exercise that
 * didn't meet its target.
 *
 * @description
 * Priority order:
 * 1. Missing sets → "2 more sets needed"
 * 2. Hold seconds gap → "5s to go" (largest gap across checked sets)
 * 3. Reps gap → "3 reps to go" (largest gap across checked sets)
 *
 * Returns null if the exercise was met or no meaningful gap exists.
 *
 * @param er - A single exercise evaluation result from gate-check.
 * @returns A gap description string, or null if the target was met.
 *
 * @example
 * getGapText({ met: false, actualCheckedSets: 2, targetSets: 3, ... })
 * // "1 more set needed"
 *
 * @example
 * getGapText({ met: false, actualReps: [10, 8], targetReps: 10, ... })
 * // "2 reps to go"
 *
 * @example
 * getGapText({ met: true, ... })
 * // null
 */
export function getGapText(er: ExerciseResult): string | null {
  if (er.met) return null

  if (er.actualCheckedSets < er.targetSets) {
    const gap = er.targetSets - er.actualCheckedSets
    return `${gap} more set${gap > 1 ? 's' : ''} needed`
  }

  if (er.targetHoldSeconds && er.actualHoldSeconds) {
    const gaps = er.actualHoldSeconds
      .slice(0, er.actualCheckedSets)
      .map(h => Math.max(0, er.targetHoldSeconds! - h))
      .filter(g => g > 0)
    if (gaps.length > 0) return `${Math.max(...gaps)}s to go`
  }

  if (er.targetReps) {
    const gaps = er.actualReps
      .slice(0, er.actualCheckedSets)
      .map(r => Math.max(0, er.targetReps! - r))
      .filter(g => g > 0)
    if (gaps.length > 0) {
      const max = Math.max(...gaps)
      return `${max} rep${max > 1 ? 's' : ''} to go`
    }
  }

  return null
}

/**
 * Returns a motivational message based on session completion percentage.
 *
 * @param pct - Overall completion percentage (0–100).
 * @returns A one-line encouragement string.
 *
 * @example
 * getCompletionMessage(100) // "Perfect — clean session!"
 * getCompletionMessage(85)  // "Almost there — so close to a clean session."
 * getCompletionMessage(60)  // "Solid work — a few more reps and you've got it."
 * getCompletionMessage(40)  // "Good effort — keep building."
 * getCompletionMessage(20)  // "Every rep counts. Keep showing up."
 */
export function getCompletionMessage(pct: number): string {
  if (pct === 100) return 'Perfect — clean session!'
  if (pct >= 90) return 'Almost there — so close to a clean session.'
  if (pct >= 75) return 'Solid work — a few more reps and you\'ve got it.'
  if (pct >= 50) return 'Good effort — keep building.'
  return 'Every rep counts. Keep showing up.'
}
