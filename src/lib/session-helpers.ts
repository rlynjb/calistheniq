import type { SessionResult } from '@/lib/gate-check'

type ExerciseResult = SessionResult['exerciseResults'][number]

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

export function getCompletionMessage(pct: number): string {
  if (pct === 100) return 'Perfect — clean session!'
  if (pct >= 90) return 'Almost there — so close to a clean session.'
  if (pct >= 75) return 'Solid work — a few more reps and you\'ve got it.'
  if (pct >= 50) return 'Good effort — keep building.'
  return 'Every rep counts. Keep showing up.'
}
