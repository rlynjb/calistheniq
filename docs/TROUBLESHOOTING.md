# Troubleshooting

## Seeded data doesn't appear in the app

**Symptom:** You ran `curl -X POST .../api/seed` but exercises or user data haven't changed.

**Cause:** `netlify functions:serve` bundles function code at startup. The `seed` function imports from `src/mocks/data/exercises.ts` — the import is resolved at bundle time, not runtime.

**Fix:** Restart `netlify dev` or `netlify functions:serve` after changing any file in `src/mocks/data/`.

## Rapid edits lose data (reps, checkboxes)

**Symptom:** You toggle several checkboxes quickly and some don't persist after refresh.

**Likely cause (if you modified the hook):** The write queue or debounce was broken. The `useUserData` hook serializes all writes via `writeQueueRef` and debounces `updateExercise` by 600ms.

**Check:**
1. The debounce timer fires and `flushExerciseUpdate()` runs (add a `console.log`)
2. The write queue resolves — check for unhandled promise rejections in console
3. `saveStatus` shows `'saved'` in the UI after edits

## Modal doesn't reflect changes after adding a category

**Symptom:** You add Push exercises to a day but the modal still shows the old state.

**Likely cause (if you modified the component):** `selectedDay` is derived from `weekDays` via `useMemo`. If `selectedDay` is stored as independent state instead of derived, it won't update when `weekDays` changes.

**Check:** `WeeklyProgress.tsx` should have:
```typescript
const selectedDay = useMemo(
  () => selectedDayDate ? weekDays.find(d => d.date.toDateString() === selectedDayDate) ?? null : null,
  [weekDays, selectedDayDate]
)
```

## `getUserData()` silently returns null

**By design.** `src/api/user.ts` wraps `getUserData()` in try/catch and returns `null` on any error. Check the browser Network tab for the actual HTTP error. Common causes:
- Functions server not running
- MSW not started (check console for `[MSW] Mock Service Worker started`)
- Blob storage empty (seed first)

## ESLint errors about `@typescript-eslint/recommended`

**Pre-existing.** The ESLint config references `@typescript-eslint/recommended` which fails to resolve. This does not block builds. Ignore or update `.eslintrc.json`.

## `netlify dev` port conflict

**Symptom:** `netlify dev` fails to start on port 8888.

**Fix:** Kill the existing process or use a different port:
```bash
lsof -ti:8888 | xargs kill
# or
netlify dev --port 8889
```

## Functions return stale exercise data after editing `exercises.ts`

Same root cause as "seeded data doesn't appear." The exercise functions (`exercises.ts`, `exercises-search.ts`, `exercises-level.ts`) import `allExercises` at bundle time. Restart the functions server.

## CORS errors in browser console

All functions return `Access-Control-Allow-Origin: *` via the shared `corsHeaders` in `netlify/functions/core/infrastructure/blob/store.ts`. If you see CORS errors:
1. Check that the function isn't crashing before returning a response (check function logs)
2. If using `netlify functions:serve` separately, requests go to a different origin — this is expected and handled by the `*` CORS header

## Production blob is empty after deploy

Netlify deploys don't touch blob storage. Blobs persist across deploys. If blob is empty on a fresh site:
```bash
# Option 1: Seed from mock data
curl -X POST https://your-site.netlify.app/api/seed

# Option 2: Import from local
curl http://localhost:8888/api/export > backup.json
curl -X POST https://your-site.netlify.app/api/import -d @backup.json -H "Content-Type: application/json"
```

## `db:*` scripts fail

These scripts reference `netlify/functions/core/infrastructure/database/` which does not exist. The app uses Netlify Blobs, not Postgres. These scripts are dead and can be removed from `package.json`.
