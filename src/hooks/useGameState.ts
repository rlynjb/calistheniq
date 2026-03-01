/**
 * @file Central game state hook — single gateway to all progression,
 * session, and week-tracking data.
 *
 * @description
 * Orchestrates loading from storage, session logging with gate evaluation,
 * level-up detection, week progress tracking, streak computation, and
 * draft session persistence. Every feature view (Home, Tree, History)
 * consumes this hook rather than accessing storage directly.
 *
 * @example
 * // Used in any feature view that needs game state
 * const { status, user, logSession, streak } = useGameState()
 *
 * @see {@link getStorage} for the underlying persistence layer
 * @see {@link HomeView} for the primary consumer of logSession/drafts
 * @see {@link TreeView} for the primary consumer of gateProgress
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  Category,
  WorkoutSession,
  GateProgress,
  WeekProgress,
  User,
  DraftSession,
} from '@/types'
import { CATEGORIES } from '@/types'
import { getStorage } from '@/lib/storage'
import {
  getGateCriteria,
  evaluateSession,
  updateGateAfterSession,
  createGateProgress,
} from '@/lib/game/gate-check'
import type { SessionResult } from '@/lib/game/gate-check'
import {
  getWeekStart,
  createWeekProgress,
  markCategoryDone,
  isWeekComplete,
  needsWeekReset,
  completedCount,
} from '@/lib/game/week-progress'
import { calculateStreak } from '@/lib/game/streaks'
import { checkCategoryLevelUp } from '@/lib/game/progression'

/**
 * Result returned by {@link useGameState.logSession} after saving a workout.
 * Contains the gate evaluation outcome and whether the user leveled up.
 */
export type LogSessionResult = {
  /** Per-exercise evaluation results and overall completion percentage. */
  sessionResult: SessionResult
  /** Updated gate progress after incorporating this session. */
  gateProgress: GateProgress
  /** Whether this session triggered a level-up for the category. */
  leveledUp: boolean
  /** The new level number if `leveledUp` is true. */
  newLevel?: number
}

/**
 * Loading lifecycle of the game state hook.
 * - `loading` — initial data fetch in progress
 * - `ready` — all data loaded, hook is usable
 * - `error` — storage fetch failed
 */
export type GameStateStatus = 'loading' | 'ready' | 'error'

/**
 * Full return shape of {@link useGameState}.
 * All feature views destructure from this interface.
 */
export interface UseGameStateReturn {
  /** Current loading lifecycle state. */
  status: GameStateStatus

  /** Authenticated user with per-category levels. Null until loaded. */
  user: User | null

  /** Current week's session completion tracking. Null until loaded. */
  weekProgress: WeekProgress | null

  /** Consecutive completed weeks (all 3 categories logged). Excludes current week. */
  streak: number

  /**
   * Gate progress keyed by `"category:level"` composite string.
   * Only the user's current level per category is guaranteed to be present.
   *
   * @example gateProgress["push:2"] // GateProgress for push level 2
   */
  gateProgress: Record<string, GateProgress>

  /** All logged workout sessions, oldest first. */
  sessions: WorkoutSession[]

  /** Per-category boolean indicating if a session was logged this week. */
  categoryDoneThisWeek: Record<Category, boolean>

  /** True when all 3 categories have been logged this week. */
  weekComplete: boolean

  /** Number of categories completed this week (0–3). */
  completedThisWeek: number

  /**
   * Persists a workout session, evaluates it against gate criteria,
   * checks for level-up, and updates week progress. This is the
   * primary write action for the entire app.
   */
  logSession: (session: WorkoutSession) => Promise<LogSessionResult>

  /** Returns the gate progress for a category at the user's current level. */
  getGateForCategory: (category: Category) => GateProgress | null

  /** Persists a draft session to blob storage (debounced by the caller). */
  saveDraft: (draft: DraftSession) => Promise<void>

  /** Loads a previously saved draft for a category/level pair, or null if none exists. */
  loadDraft: (category: Category, level: number) => Promise<DraftSession | null>

  /** Re-fetches all data from storage. Used for manual refresh scenarios. */
  reload: () => Promise<void>
}

/**
 * Builds the composite key used to index gate progress in the map.
 *
 * @param category - The exercise category (push, pull, squat).
 * @param level - The skill level (1–5).
 * @returns Composite key in the format `"category:level"`.
 *
 * @example gateKey('push', 2) // "push:2"
 */
function gateKey(category: Category, level: number) {
  return `${category}:${level}`
}

/**
 * Manages all game state: user profile, sessions, gates, weeks, streaks, and drafts.
 *
 * @description
 * Loads all data from blob storage on mount (once via initRef guard).
 * Provides `logSession` as the single write path — it persists the session,
 * evaluates it against gate criteria, handles level-ups, updates week
 * progress, and clears the draft in one atomic flow.
 *
 * Gate progress is stored in a flat map keyed by `"category:level"` strings.
 * On load, gates at the user's current level are forced to `"in-progress"`
 * if they were incorrectly stored as `"locked"`.
 *
 * Streaks are computed from historical sessions, excluding the current week.
 *
 * @returns Full game state and mutation functions — see {@link UseGameStateReturn}.
 *
 * @example
 * const { status, user, logSession, categoryDoneThisWeek } = useGameState()
 *
 * if (status === 'loading') return <Spinner />
 * if (!user) return <ErrorState />
 *
 * @see {@link LogSessionResult} for the shape returned by logSession
 */
export function useGameState(): UseGameStateReturn {
  const [status, setStatus] = useState<GameStateStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [weekProgress, setWeekProgress] = useState<WeekProgress | null>(null)
  const [streak, setStreak] = useState(0)
  const [gateProgress, setGateProgress] = useState<Record<string, GateProgress>>({})
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const initRef = useRef(false)

  const load = useCallback(async () => {
    const storage = getStorage()

    // Load user
    const loadedUser = await storage.getUser()

    // Load current week progress
    const currentWeekStart = getWeekStart(new Date())
    let loadedWeek = await storage.getWeekProgress(currentWeekStart)

    // Load sessions once (used for streak computation below)
    const allSessions = await storage.getSessions()

    // Check for week reset — if stored week is from a previous week, archive it
    if (needsWeekReset(loadedWeek, new Date())) {
      loadedWeek = createWeekProgress(new Date())
      await storage.updateWeekProgress(loadedWeek)
    }

    // Load gate progress for user's current levels
    const gates: Record<string, GateProgress> = {}
    for (const cat of CATEGORIES) {
      const level = loadedUser.levels[cat]
      const gate = await storage.getGateProgress(level, cat)
      // Gate at the user's current level should never be locked —
      // this guards against stale data where a level-up didn't correctly
      // initialize the new gate.
      if (gate.status === 'locked') {
        gate.status = 'in-progress'
      }
      gates[gateKey(cat, level)] = gate
    }

    // Compute streak from session history
    const prevWeeks = buildWeekHistory(allSessions)
    const computedStreak = calculateStreak(prevWeeks)

    setUser(loadedUser)
    setWeekProgress(loadedWeek)
    setStreak(computedStreak)
    setGateProgress(gates)
    setSessions(allSessions)
    setStatus('ready')
  }, [])

  // Load once on mount. initRef prevents double-fire in React StrictMode.
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      load().catch(() => setStatus('error'))
    }
  }, [load])

  const logSession = useCallback(async (session: WorkoutSession): Promise<LogSessionResult> => {
    const storage = getStorage()

    // 1. Save session
    await storage.saveSession(session)
    setSessions(prev => [...prev, session])

    // 2. Evaluate against gate criteria
    const criteria = getGateCriteria(session.category, session.level)
    let sessionResult: SessionResult
    let updatedGate: GateProgress
    let leveledUp = false
    let newLevel: number | undefined

    if (criteria) {
      const currentGateKey = gateKey(session.category, session.level)
      const currentGate = gateProgress[currentGateKey] ??
        createGateProgress(session.category, session.level, user?.levels[session.category] ?? 1)

      sessionResult = evaluateSession(session, criteria)
      updatedGate = updateGateAfterSession(currentGate, sessionResult, criteria, session.date)

      // Persist gate
      await storage.updateGateProgress(updatedGate)

      // Check level up
      if (updatedGate.status === 'passed' && user) {
        // Shallow-copy user to avoid mutating React state directly.
        // checkCategoryLevelUp mutates the passed user object.
        const userCopy: User = {
          ...user,
          levels: { ...user.levels },
        }
        leveledUp = checkCategoryLevelUp(updatedGate, userCopy)
        if (leveledUp) {
          newLevel = userCopy.levels[session.category]
          await storage.updateUser(userCopy)
          setUser(userCopy)

          // Initialize gate for new level
          const newGate = createGateProgress(session.category, newLevel, newLevel)
          await storage.updateGateProgress(newGate)
          setGateProgress(prev => ({
            ...prev,
            [currentGateKey]: updatedGate,
            [gateKey(session.category, newLevel!)]: newGate,
          }))
        } else {
          setGateProgress(prev => ({
            ...prev,
            [currentGateKey]: updatedGate,
          }))
        }
      } else {
        setGateProgress(prev => ({
          ...prev,
          [gateKey(session.category, session.level)]: updatedGate,
        }))
      }
    } else {
      // No criteria found — treat as clean session with 100% completion
      sessionResult = { isClean: true, completionPct: 100, exerciseResults: [] }
      updatedGate = createGateProgress(session.category, session.level, user?.levels[session.category] ?? 1)
    }

    // 3. Update week progress
    if (weekProgress) {
      const updatedWeek = markCategoryDone(weekProgress, session.category)
      await storage.updateWeekProgress(updatedWeek)
      setWeekProgress(updatedWeek)
    }

    // Clear draft after successful save
    await storage.clearDraft(session.category, session.level)

    return { sessionResult, gateProgress: updatedGate, leveledUp, newLevel }
  }, [gateProgress, user, weekProgress])

  const saveDraft = useCallback(async (draft: DraftSession): Promise<void> => {
    const storage = getStorage()
    await storage.saveDraft(draft)
  }, [])

  const loadDraft = useCallback(async (category: Category, level: number): Promise<DraftSession | null> => {
    const storage = getStorage()
    return storage.getDraft(category, level)
  }, [])

  const getGateForCategory = useCallback((category: Category): GateProgress | null => {
    if (!user) return null
    const level = user.levels[category]
    return gateProgress[gateKey(category, level)] ?? null
  }, [user, gateProgress])

  const categoryDoneThisWeek: Record<Category, boolean> = weekProgress
    ? weekProgress.sessionsCompleted
    : { push: false, pull: false, squat: false }

  const weekComplete = weekProgress ? isWeekComplete(weekProgress) : false
  const completedThisWeek = weekProgress ? completedCount(weekProgress) : 0

  return {
    status,
    user,
    weekProgress,
    streak,
    gateProgress,
    sessions,
    categoryDoneThisWeek,
    weekComplete,
    completedThisWeek,
    logSession,
    getGateForCategory,
    saveDraft,
    loadDraft,
    reload: load,
  }
}

/**
 * Reconstructs week-by-week completion history from raw session data.
 * Used to compute the user's streak of consecutive completed weeks.
 *
 * @description
 * Groups sessions by their week start date, determines which categories
 * were completed in each week, and returns them sorted oldest-first.
 * Excludes the current week since it's still in progress and shouldn't
 * count toward the streak.
 *
 * @param sessions - All logged workout sessions from storage.
 * @returns WeekProgress entries sorted oldest→newest, excluding current week.
 */
function buildWeekHistory(sessions: WorkoutSession[]): WeekProgress[] {
  const byWeek = new Map<string, Set<Category>>()

  for (const s of sessions) {
    const weekStart = getWeekStart(new Date(s.date))
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, new Set())
    byWeek.get(weekStart)!.add(s.category)
  }

  const currentWeekStart = getWeekStart(new Date())

  return Array.from(byWeek.entries())
    .filter(([ws]) => ws !== currentWeekStart)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, cats]): WeekProgress => ({
      weekStart,
      sessionsCompleted: {
        push: cats.has('push'),
        pull: cats.has('pull'),
        squat: cats.has('squat'),
      },
    }))
}
