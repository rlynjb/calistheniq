# CalisthenIQ API Reference

## Quick Reference

| Method | Path | Description | Used By Frontend |
|--------|------|-------------|:---:|
| `GET` | `/game/data?key=<key>` | Read a value from key-value store | Yes |
| `PUT` | `/game/data` | Write a value to key-value store | Yes |
| `DELETE` | `/game/data?key=<key>` | Delete a key from store | No |
| `GET` | `/health` | Health check | No |
| `POST` | `/seed` | Seed blob store from mock fixtures | No |
| `GET` | `/export` | Dump all blob data as JSON | No |
| `POST` | `/import` | Restore blob data from JSON | No |

---

## Getting Started

### 1. Pick Your Runtime Mode

| Mode | Command | Base URL | Data Persistence |
|------|---------|----------|-----------------|
| **MSW (mocks)** | `npm run dev` with `NEXT_PUBLIC_MSW_ENABLED=true` | N/A (intercepted in-browser) | In-memory, resets on refresh |
| **Netlify Dev** | `netlify dev` | `http://localhost:8888` | `.netlify/blobs/` on disk |
| **Functions Only** | `netlify functions:serve --port 9999` | `http://localhost:9999` | `.netlify/blobs/` on disk |
| **Production** | Deployed via `netlify deploy --prod` | Your Netlify site URL | Netlify Blob Store (cloud) |

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_MSW_ENABLED=false                  # "true" = mock mode, no backend needed
NEXT_PUBLIC_API_BASE_URL=http://localhost:9999  # empty string = same-origin (production)
NEXT_PUBLIC_API_TIMEOUT=10000                   # ms, default 10000
```

### 3. Your First Successful Call (Under 60 Seconds)

```bash
# Start functions server
netlify functions:serve --port 9999 &

# Health check
curl -s http://localhost:9999/health | jq
# → { "status": "ok", "timestamp": "2026-03-01T...", "mock": false }

# Read game data (will be null if empty)
curl -s "http://localhost:9999/game/data?key=user" | jq
# → null

# Write game data
curl -s -X PUT http://localhost:9999/game/data \
  -H "Content-Type: application/json" \
  -d '{"key":"user","value":{"id":"default","levels":{"push":1,"pull":1,"squat":1},"createdAt":"2026-03-01T00:00:00.000Z"}}' | jq
# → { "success": true }

# Read it back
curl -s "http://localhost:9999/game/data?key=user" | jq
# → { "id": "default", "levels": { "push": 1, "pull": 1, "squat": 1 }, ... }
```

### 4. URL Routing

In `netlify dev` mode, the `/api/*` redirect in `netlify.toml` maps requests:

```
/api/game/data  →  /.netlify/functions/game-data
/api/seed       →  /.netlify/functions/seed
/api/health     →  /.netlify/functions/health
```

When using `netlify functions:serve` standalone, there are **no redirects**. The function's `config.path` registers the route directly (e.g., `/game/data`, `/health`).

In production, both `/api/*` redirects and direct paths work.

---

## CORS

All endpoints return these headers on every response:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Content-Type: application/json
```

Every endpoint handles `OPTIONS` preflight and returns `204 No Content`.

> **TODO (pre-production):** Replace `Access-Control-Allow-Origin: *` with an explicit origin allowlist. This is tracked in `netlify/functions/core/infrastructure/blob/store.ts`.

---

## Authentication

**None.** There is no authentication on any endpoint. This is a single-user personal app. All data is accessible to anyone who can reach the server.

> **TODO:** The `seed` and `import` endpoints overwrite all stored data. Add auth before production if the app is ever exposed publicly.

---

## Rate Limiting

**None.** Netlify Functions have platform-level limits (125K invocations/month on free tier, 10-second execution timeout), but no per-endpoint rate limiting is implemented.

---

## Error Response Shape

All error responses from all endpoints use this shape:

```json
{
  "error": "Human-readable error message"
}
```

Status codes used across the API:

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | All successful reads and writes |
| 204 | No Content | CORS preflight `OPTIONS` |
| 400 | Bad Request | Missing required parameter or invalid body |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Wrong HTTP method for endpoint |
| 500 | Internal Server Error | Blob store failure, JSON parse error, or unhandled exception |

---

## Primary API: Game Data Store

This is the **only endpoint the frontend uses**. Everything else is legacy or tooling.

The `game-data` function is a generic key-value store backed by Netlify Blobs (store name: `"game-data"`). The frontend's `NetlifyBlobAdapter` (`src/lib/storage/netlify-blob.ts`) wraps this endpoint to implement domain-specific operations.

**Source:** `netlify/functions/game-data.ts`

---

### `GET /game/data`

Read a value by key.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | The storage key to read |

**Success Response — `200 OK`:**

Returns the raw JSON value stored under that key. If the key doesn't exist, returns `null`.

```bash
curl -s "http://localhost:9999/game/data?key=sessions" | jq
```

```json
[
  {
    "id": "push-1-1709251200000",
    "date": "2026-03-01T10:00:00.000Z",
    "level": 1,
    "category": "push",
    "exercises": [
      {
        "exerciseId": "beginner-negative-push-ups",
        "targetSets": 3,
        "targetReps": 8,
        "actualSets": 3,
        "actualReps": [8, 8, 8],
        "checkedSets": [true, true, true],
        "hitTarget": true
      }
    ]
  }
]
```

**Empty key response — `200 OK`:**

```json
null
```

**Error Response — `400 Bad Request`:**

```bash
curl -s "http://localhost:9999/game/data" | jq
```

```json
{
  "error": "Missing key parameter"
}
```

---

### `PUT /game/data`

Write a value by key. Overwrites any existing value. Creates the key if it doesn't exist.

**Request Body:**

```json
{
  "key": "sessions",
  "value": [{ "id": "push-1-1709251200000", "..." : "..." }]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | The storage key |
| `value` | any | Yes | Any JSON-serializable value. Can be `null` (used by `clearDraft`). |

**Success Response — `200 OK`:**

```json
{
  "success": true
}
```

**Error Response — `400 Bad Request`:**

```json
{
  "error": "Missing key in body"
}
```

**Curl Example:**

```bash
curl -s -X PUT http://localhost:9999/game/data \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user",
    "value": {
      "id": "default",
      "levels": { "push": 2, "pull": 1, "squat": 1 },
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  }' | jq
```

---

### `DELETE /game/data`

Remove a key from the store entirely.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | The storage key to delete |

**Success Response — `200 OK`:**

```json
{
  "success": true
}
```

Succeeds even if the key didn't exist (idempotent).

**Curl Example:**

```bash
curl -s -X DELETE "http://localhost:9999/game/data?key=draft:push:1" | jq
```

> **Note:** The frontend doesn't use DELETE. Draft clearing is done via `PUT` with `value: null`. The DELETE method exists but is unused in the current codebase.

---

### Storage Keys Used by the Frontend

The `NetlifyBlobAdapter` stores all game state under these keys:

| Key | JSON Type | Written By | Read-Modify-Write? |
|-----|-----------|-----------|:---:|
| `sessions` | `WorkoutSession[]` | `saveSession()` | Yes |
| `gate-progress` | `Record<"push:1" \| "pull:2" \| ..., GateProgress>` | `updateGateProgress()` | Yes |
| `week-progress` | `Record<"2026-02-24" \| ..., WeekProgress>` | `updateWeekProgress()` | Yes |
| `user` | `User` | `updateUser()` | No (full overwrite) |
| `draft:push:1` | `DraftSession \| null` | `saveDraft()` | No (full overwrite) |
| `draft:pull:1` | `DraftSession \| null` | `saveDraft()` | No (full overwrite) |
| `draft:squat:1` | `DraftSession \| null` | `saveDraft()` | No (full overwrite) |

Draft keys follow the pattern `draft:<category>:<level>`. There can be up to 15 draft keys (3 categories x 5 levels), but in practice only 3 exist at any time (one per category at the user's current level).

### Data Shapes Per Key

#### `sessions` — `WorkoutSession[]`

```json
[
  {
    "id": "push-1-1709251200000",
    "date": "2026-03-01T10:00:00.000Z",
    "level": 1,
    "category": "push",
    "exercises": [
      {
        "exerciseId": "beginner-negative-push-ups",
        "targetSets": 3,
        "targetReps": 8,
        "actualSets": 3,
        "actualReps": [8, 8, 7],
        "checkedSets": [true, true, true],
        "hitTarget": false,
        "actualHoldSeconds": null
      }
    ],
    "notes": "felt good"
  }
]
```

#### `gate-progress` — `Record<string, GateProgress>`

```json
{
  "push:1": {
    "level": 1,
    "category": "push",
    "status": "in-progress",
    "consecutivePasses": 2,
    "lastSessionDate": "2026-03-01T10:00:00.000Z"
  },
  "pull:1": {
    "level": 1,
    "category": "pull",
    "status": "passed",
    "consecutivePasses": 3,
    "lastSessionDate": "2026-02-28T10:00:00.000Z"
  }
}
```

`status` values: `"locked"` | `"in-progress"` | `"passed"`

#### `week-progress` — `Record<string, WeekProgress>`

```json
{
  "2026-02-24": {
    "weekStart": "2026-02-24",
    "sessionsCompleted": {
      "push": true,
      "pull": true,
      "squat": false
    }
  }
}
```

Key is the Monday date string `"YYYY-MM-DD"` for that week.

#### `user` — `User`

```json
{
  "id": "default",
  "levels": {
    "push": 2,
    "pull": 1,
    "squat": 1
  },
  "createdAt": "2026-01-15T00:00:00.000Z"
}
```

Levels are 1-indexed. Level 1 = Beginner, Level 5 = Expert.

#### `draft:<category>:<level>` — `DraftSession | null`

```json
{
  "category": "push",
  "level": 1,
  "exercises": [
    {
      "exerciseId": "beginner-negative-push-ups",
      "checkedSets": [true, true, false],
      "actualReps": [8, 8, 0],
      "actualHoldSeconds": null
    }
  ],
  "notes": "working on form",
  "savedAt": "2026-03-01T10:05:00.000Z"
}
```

Drafts auto-save 500ms after each form interaction. Cleared automatically when a session is finalized via `logSession()`.

---

### HTTP Request Count Per Operation

The `NetlifyBlobAdapter` uses read-modify-write for collections. Here's the actual request count for each frontend operation:

| Operation | GET | PUT | Total |
|-----------|-----|-----|-------|
| **Initial load** (`useGameState.load`) | 5-6 | 0-1 | 5-7 |
| **Expand category** (load draft) | 1 | 0 | 1 |
| **Toggle checkbox / edit reps** (debounced) | 0 | 1 | 1 |
| **Save session** (no level-up) | 3 | 4 | 7 |
| **Save session** (with level-up) | 3 | 5 | 8 |

**Initial load breakdown:**

```
GET /game/data?key=user               → 1
GET /game/data?key=week-progress       → 1
GET /game/data?key=sessions            → 1
GET /game/data?key=gate-progress       → 3 (one per category)
PUT /game/data (week-progress)         → 0-1 (only if week reset needed)
```

**Save session breakdown (with level-up):**

```
GET  sessions → read all          PUT  sessions → append + write back
GET  gate-progress → read all     PUT  gate-progress → update gate (passed)
                                  PUT  user → new levels
GET  gate-progress → read again   PUT  gate-progress → write new level gate
GET  week-progress → read all     PUT  week-progress → mark category done
                                  PUT  draft:cat:level → clear (set null)
```

---

## Gotchas & Edge Cases

### 1. Silent Read Failures

`NetlifyBlobAdapter.get()` catches all errors and returns `null`:

```typescript
private async get<T>(key: string): Promise<T | null> {
  try {
    const res = await apiClient.get<T>('/game/data', { key })
    return res.data ?? null
  } catch (err) {
    console.warn('[NetlifyBlobAdapter] get failed for key:', key, err)
    return null  // ← caller gets null, proceeds as if no data exists
  }
}
```

If the blob store is unreachable during `saveSession()`, `getSessions()` returns `[]`. The next `set('sessions', [newSession])` **overwrites all session history** with a single entry. This is a data loss vector on network failures.

### 2. Read-Modify-Write Race Conditions

`saveSession`, `updateGateProgress`, and `updateWeekProgress` all do:
1. GET the entire collection
2. Modify in memory
3. PUT the entire collection back

Two concurrent writes to the same key will lose whichever writes first (last-write-wins). Not a real risk for a single-user, single-tab app, but would break under concurrent access.

### 3. Unbounded Session Growth

The `sessions` key stores every workout session ever logged as a flat array. At 100 sessions, each save re-sends ~50KB. At 1,000 sessions, ~500KB. No pagination, no archival.

### 4. Response Wrapping Inconsistency

The `ApiClient` wraps responses in `{ data: T, success: boolean }`. But the `game-data` function returns raw values for GET and `{ success: true }` for PUT/DELETE. The `ApiClient.request()` method does `const data = await response.json()` and wraps it as `{ data, success: true }`.

This means:
- `GET /game/data?key=user` returns `{ "id": "default", ... }` from the server
- `apiClient.get()` returns `{ data: { "id": "default", ... }, success: true }`
- `NetlifyBlobAdapter.get()` extracts `res.data` which is the raw user object

For PUT responses:
- Server returns `{ "success": true }`
- `apiClient.put()` returns `{ data: { success: true }, success: true }` (double-wrapped)
- `NetlifyBlobAdapter.set()` ignores the response

### 5. Category Casing Mismatch

The game state types use **lowercase** categories: `"push"`, `"pull"`, `"squat"`.
The legacy endpoints use **PascalCase**: `"Push"`, `"Pull"`, `"Squat"`.

These are two separate data models. They do not share storage. The game state lives in the `game-data` blob store; legacy user data lives in the `user-data` blob store.

### 6. Timeout Behavior

`ApiClient` aborts requests after 10 seconds (configurable via `NEXT_PUBLIC_API_TIMEOUT`). The abort throws an error that propagates as:

```json
{
  "message": "The operation was aborted",
  "status": undefined
}
```

The `NetlifyBlobAdapter.get()` swallows this and returns `null`. The `NetlifyBlobAdapter.set()` does **not** catch, so the error bubbles to `logSession()`, which bubbles to the UI as `saveError`.

### 7. `null` vs Key-Not-Found

Both "key doesn't exist" and "key was explicitly set to `null`" return `null` from `GET /game/data`. This is by design — `clearDraft()` writes `null` instead of using DELETE, and `getDraft()` treats `null` as "no draft."

### 8. No Request Validation on PUT Body Values

The `game-data` function validates that `body.key` exists, but does **not** validate `body.value`. You can store anything — a string, a number, a deeply nested object, `null`, or even `undefined` (which becomes `null` in JSON). There is no schema enforcement server-side.

### 9. MSW Mock Behavior Differences

The MSW mock handlers (`src/mocks/handlers.ts`) use an in-memory `Map<string, unknown>` for game data. Behavioral differences from the real backend:

- **Persistence:** MSW data resets on page refresh. Real backend persists.
- **Response shape:** MSW returns the raw value directly from `HttpResponse.json()`. The real backend returns it via `jsonResponse()` which pretty-prints with 2-space indentation. Functionally identical, but byte-for-byte different.
- **DELETE handler:** MSW's DELETE returns `{ success: true }` even for non-existent keys (same as real backend — both are idempotent).

---

## Tooling Endpoints

### `GET /health`

**Source:** `netlify/functions/health.ts`

```bash
curl -s http://localhost:9999/health | jq
```

```json
{
  "status": "ok",
  "timestamp": "2026-03-01T10:00:00.000Z",
  "mock": false
}
```

MSW mock returns `"mock": true`. Real backend returns `"mock": false`.

---

### `POST /seed`

Populates blob storage from mock fixture files. Overwrites existing data.

**Source:** `netlify/functions/seed.ts`

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `only` | `"user"` \| `"exercises"` | No | Seed only the specified data type |

**Curl Examples:**

```bash
# Seed everything
curl -s -X POST http://localhost:8888/api/seed | jq

# Seed only exercises (won't touch user progress)
curl -s -X POST "http://localhost:8888/api/seed?only=exercises" | jq

# Seed only user data
curl -s -X POST "http://localhost:8888/api/seed?only=user" | jq
```

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "message": "Seeded user and exercises from mock data",
  "data": {
    "userData": { "currentLevels": { "Push": 2, "Pull": 1, "Squat": 1 }, "..." : "..." },
    "workoutLevels": { "..." : "..." }
  }
}
```

> **Warning:** Seed writes to the `user-data` and `exercises` blob stores (legacy). It does **not** seed the `game-data` store used by the current frontend. To populate game state, use the `/import` endpoint or the app itself.

---

### `GET /export`

Dumps current blob store contents as JSON.

**Source:** `netlify/functions/export.ts`

```bash
curl -s http://localhost:8888/api/export | jq > snapshot.json
```

```json
{
  "success": true,
  "exportedAt": "2026-03-01T10:00:00.000Z",
  "data": {
    "userData": { "..." : "..." },
    "workoutLevels": { "..." : "..." }
  }
}
```

> **Note:** Only exports from the `user-data` and `exercises` blob stores. Does **not** export from the `game-data` store. To export game state, read each key individually via `GET /game/data?key=sessions`, etc.

---

### `POST /import`

Restores blob store contents from a JSON snapshot.

**Source:** `netlify/functions/import.ts`

**Request Body:**

```json
{
  "data": {
    "userData": { "currentLevels": { "Push": 2 }, "..." : "..." },
    "workoutLevels": { "..." : "..." }
  }
}
```

Either `userData` or `workoutLevels` can be omitted to do a partial import.

```bash
curl -s -X POST http://localhost:8888/api/import \
  -H "Content-Type: application/json" \
  -d @snapshot.json | jq
```

```json
{
  "success": true,
  "message": "Imported data to blob store",
  "imported": {
    "userData": true,
    "workoutLevels": true
  }
}
```

> **Same caveat as /export:** Only writes to legacy blob stores, not `game-data`.

---

## Blob Store Architecture

Three separate Netlify Blob stores back the API:

| Store Name | Used By | Keying Strategy |
|------------|---------|-----------------|
| `game-data` | `/game/data` endpoint, frontend | Arbitrary string keys |
| `user-data` | `/seed`, `/export`, `/import` | Single fixed key: `"user-progress"` |
| `exercises` | `/seed`, `/export`, `/import` | Fixed keys: `"workout-levels"`, `"all-exercises"` |

The `game-data` store is the only one actively used. The other two are legacy.

### Local Development Storage

When running `netlify dev` or `netlify functions:serve`, blob data is stored at:

```
.netlify/blobs/deploy/<store-name>/<key>
```

Each key is a file containing the JSON value. You can inspect them directly:

```bash
cat .netlify/blobs/deploy/game-data/sessions | jq
cat .netlify/blobs/deploy/game-data/user | jq
```

To reset all game state locally:

```bash
rm -rf .netlify/blobs/deploy/game-data/
```

---

## Client-Side API Layer

The frontend never calls endpoints directly. The call chain is:

```
React Component
  → useGameState() hook (src/hooks/useGameState.ts)
    → StorageProvider interface (src/lib/storage/provider.ts)
      → NetlifyBlobAdapter (src/lib/storage/netlify-blob.ts)
        → ApiClient singleton (src/api/client.ts)
          → fetch() → Netlify Function → @netlify/blobs
```

### ApiClient (`src/api/client.ts`)

Singleton instance exported as `apiClient`. Configured from environment variables at construction time.

```typescript
// Usage
import { apiClient } from '@/api/client'

const res = await apiClient.get<User>('/game/data', { key: 'user' })
// res.data = { id: "default", levels: { push: 1, pull: 1, squat: 1 }, ... }

await apiClient.put('/game/data', { key: 'user', value: updatedUser })
// returns { data: { success: true }, success: true }
```

**Timeout:** 10 seconds via `AbortController`. Configurable via `NEXT_PUBLIC_API_TIMEOUT`.

**Error behavior:** Throws `{ message: string, status?: number }` on non-2xx responses or network failures. Does **not** retry.

### StorageProvider (`src/lib/storage/provider.ts`)

Interface with 11 methods. Currently one implementation: `NetlifyBlobAdapter`.

```typescript
import { getStorage } from '@/lib/storage'

const storage = getStorage()  // returns singleton NetlifyBlobAdapter

// Sessions
await storage.saveSession(session)                      // read-modify-write 'sessions'
const all = await storage.getSessions()                 // read 'sessions', optional filter
const filtered = await storage.getSessions('push', 1)   // filter by category and level

// Gate progress
const gate = await storage.getGateProgress(1, 'push')   // read 'gate-progress', extract key
await storage.updateGateProgress(updatedGate)            // read-modify-write 'gate-progress'

// Week progress
const week = await storage.getWeekProgress('2026-02-24') // read 'week-progress', extract key
await storage.updateWeekProgress(updatedWeek)            // read-modify-write 'week-progress'

// User
const user = await storage.getUser()                     // read 'user', default if missing
await storage.updateUser(updatedUser)                    // overwrite 'user'

// Drafts (added for auto-save)
await storage.saveDraft(draftSession)                    // overwrite 'draft:push:1'
const draft = await storage.getDraft('push', 1)          // read 'draft:push:1'
await storage.clearDraft('push', 1)                      // set 'draft:push:1' to null
```

### Swapping the Storage Backend

For testing or future migration:

```typescript
import { setStorage } from '@/lib/storage'

setStorage(myCustomProvider)  // must implement StorageProvider interface
```

The `setStorage()` function replaces the singleton. Used in tests with `resetMockData()`.
