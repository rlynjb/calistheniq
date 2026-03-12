# Manual (Home) vs Camera (Workout)

## Entry point
- **Manual:** Tap category card on home page
- **Camera:** `/workout` tab → select category

## Input method
- **Manual:** Checkboxes + number inputs per set
- **Camera:** Camera pose detection counts reps automatically

## State hook
- **Manual:** `src/features/home/useExerciseForm.ts`
- **Camera:** `src/features/workout/useWorkoutSession.ts`

## Draft saving
- **Manual:** Auto-saves to blob storage every 500ms, restorable on revisit
- **Camera:** No drafts — live session only

## Pre-fill
- **Manual:** Restores from draft, or pre-fills from last session's values
- **Camera:** Starts at 0, counts up from camera

## Set tracking
- **Manual:** User manually checks each set + types rep count
- **Camera:** Camera auto-increments reps; user taps "Next Set" to advance

## Hold exercises
- **Manual:** User types seconds per set
- **Camera:** Plank processor tracks hold time in real-time via shoulder-hip-ankle alignment

## Notes
- **Manual:** Text field included
- **Camera:** Not supported

## Session result
- **Manual:** Inline `SessionResult` inside the expanded card
- **Camera:** Separate `WorkoutResult` screen

## Output
- Both produce the exact same `WorkoutSession` type via `buildSession()`

## hitTarget logic
- Identical — checks all checked sets meet target, all sets completed

## Gate/progression
- Both call `logSession()` from `useGameState` — same gate check, same level-up flow

---

**Key takeaway:** Both produce the exact same `WorkoutSession` type and call the same `logSession()`. The only difference is *how* the rep/hold data gets populated — manual typing vs camera pose detection. History, gate progression, and streaks work identically regardless of which method was used.
