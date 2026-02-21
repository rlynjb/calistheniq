# API Reference

All endpoints are Netlify Functions. In production and `netlify dev`, the `netlify.toml` redirect maps `/api/*` to `/.netlify/functions/*`.

When running `netlify functions:serve` separately (port 9999), use `http://localhost:9999/.netlify/functions/*` directly.

All responses include CORS headers (`Access-Control-Allow-Origin: *`).

---

## Exercise Endpoints

### GET /api/exercises

List exercises with optional filtering. Returns `BaseExercise[]`.

Data source: `allExercises` imported from `src/mocks/data/exercises.ts` at bundle time.

| Param | Type | Description |
|-------|------|-------------|
| `level` | number | Filter by difficulty level (0-4) |
| `category` | string | Filter by category (`Push`, `Pull`, `Squat`) |

```bash
curl "http://localhost:8888/api/exercises?level=1&category=Push"
```

```json
[
  {
    "name": "Knee Push-up",
    "sets": [{ "reps": 8 }, { "reps": 8 }, { "reps": 8 }],
    "tempo": "2110",
    "rest": 60
  }
]
```

### POST /api/exercises

Add exercise. **Stub only** — returns the body without persisting.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `sets` | `BaseExerciseSet[]` | No |

**Validation:** Returns 400 if `name` is missing.

```json
// Response
{ "success": true, "exercise": { "name": "..." } }
```

### GET /api/exercises/levels

Get all workout levels with exercises grouped by category.

Data source: blob storage first, falls back to imported `workoutLevels`.

```bash
curl http://localhost:8888/api/exercises/levels
```

```json
{
  "beginner": {
    "name": "Beginner",
    "description": "...",
    "exercises": {
      "Push": [{ "name": "...", "sets": [...], "tempo": "...", "rest": 60 }],
      "Pull": [...],
      "Squat": [...]
    },
    "progressionNotes": { "Push": "...", "Pull": "...", "Squat": "..." }
  }
}
```

### GET /api/exercises/level

Get level info for a specific exercise by name (case-insensitive).

| Param | Type | Required |
|-------|------|----------|
| `name` | string | Yes |

```bash
curl "http://localhost:8888/api/exercises/level?name=Push-up"
```

```json
{
  "level": 2,
  "name": "Intermediate",
  "category": "Push",
  "originalSets": [{ "reps": 10 }, { "reps": 10 }, { "reps": 10 }]
}
```

Returns `null` with status 400 if `name` is missing, `null` with 404 if not found.

### GET /api/exercises/search

Search exercises by name or tags.

| Param | Type | Required |
|-------|------|----------|
| `q` | string | Yes |

```bash
curl "http://localhost:8888/api/exercises/search?q=push"
```

Returns `BaseExercise[]`. Empty array if `q` is missing.

---

## User Endpoints

### GET /api/user-data

Get the full user data blob. Returns `UserData`.

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Optional. Filter `weeklyProgress` to sessions containing this category, sorted by date descending. |

If blob is empty, returns default: `{ currentLevels: { Push: 0, Pull: 0, Squat: 0 }, lastUpdated: "...", weeklyProgress: [] }`.

On read, sessions dated beyond the current week's Saturday are pruned and the blob is re-saved.

```bash
curl http://localhost:8888/api/user-data
curl "http://localhost:8888/api/user-data?category=Push"
```

### PUT /api/user-data

Replace the full user data blob. Sets `lastUpdated` to current timestamp.

```bash
curl -X PUT http://localhost:8888/api/user-data \
  -H "Content-Type: application/json" \
  -d '{"currentLevels":{"Push":2,"Pull":1,"Squat":1},"weeklyProgress":[]}'
```

Returns the saved `UserData`.

### GET /api/user-levels

Get current levels only. Returns `CurrentUserLevels`.

```bash
curl http://localhost:8888/api/user-levels
```

```json
{ "Push": 2, "Pull": 1, "Squat": 1 }
```

### PUT /api/user-levels

Update a single category level. Reads existing blob, patches the category, writes back.

| Field | Type | Required |
|-------|------|----------|
| `category` | string | Yes |
| `level` | number | Yes |

**Validation:** Returns 400 if `category` or `level` is missing/wrong type.

```bash
curl -X PUT http://localhost:8888/api/user-levels \
  -H "Content-Type: application/json" \
  -d '{"category":"Push","level":3}'
```

```json
{ "success": true }
```

---

## Data Management Endpoints

### POST /api/seed

Push mock fixture data into blob storage.

| Param | Type | Description |
|-------|------|-------------|
| `only` | string | Optional. `"exercises"` or `"user"` to seed selectively. |

```bash
curl -X POST http://localhost:8888/api/seed
curl -X POST "http://localhost:8888/api/seed?only=exercises"
```

### GET /api/export

Dump all blob data as JSON.

```bash
curl http://localhost:8888/api/export > backup.json
```

```json
{
  "success": true,
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "data": {
    "userData": { ... },
    "workoutLevels": { ... }
  }
}
```

### POST /api/import

Load JSON data into blob storage.

**Expected body:** The exact output of `/api/export`.

```bash
curl -X POST http://localhost:8888/api/import \
  -d @backup.json \
  -H "Content-Type: application/json"
```

**Validation:** Returns 400 if `body.data` is missing.

---

## Health

### GET /api/health

```json
{ "status": "ok", "timestamp": "...", "mock": false }
```

MSW returns the same shape with `"mock": true`.

---

## Client-Side API Layer

Source: `src/api/`

The frontend uses `src/api/index.ts` which exposes:

```typescript
import { api } from '@/api'

api.exercises.getWorkoutLevels()           // GET /exercises/levels
api.exercises.getExercisesByLevel(1, 'Push') // GET /exercises?level=1&category=Push
api.exercises.searchExercises('push')      // GET /exercises/search?q=push
api.exercises.getExerciseLevel('Push-up')  // GET /exercises/level?name=Push-up
api.exercises.addExercise(exercise)        // POST /exercises

api.user.getUserData()                     // GET /user/data (returns null on error)
api.user.updateUserData(data)              // PUT /user/data
api.user.getCurrentLevels()                // GET /user/levels
api.user.updateLevel('Push', 3)            // PUT /user/levels (returns boolean)

api.healthCheck()                          // GET /health (returns boolean)
```

`getUserData()` swallows exceptions and returns `null`. `updateLevel()` swallows exceptions and returns `false`.

Components should use the `useUserData` hook for all write operations rather than calling `api.user.*` directly.

---

## Error Responses

All error responses follow:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing required params) |
| 404 | Not found |
| 405 | Method not allowed |
| 500 | Internal server error |
