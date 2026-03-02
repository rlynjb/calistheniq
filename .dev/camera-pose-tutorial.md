# MediaPipe Pose Detection — Tutorial & Adding Exercises

## How it works (end to end)

```
Phone camera
    |
    v
getUserMedia() → <video> element
    |
    v
MediaPipe PoseLandmarker (WASM + GPU)
    |  Runs detectForVideo() on each animation frame
    v
33 Landmarks (x, y, z, visibility)
    |  Normalized 0.0–1.0 coordinates
    v
Exercise Processor (pure math)
    |  Picks 3 landmarks → calculates angle → feeds state machine
    v
RepCounter state machine
    |  idle → ready → down → bottom → up → ready (count++)
    v
UI update (rep count or hold timer)
```

### The 33 landmarks

MediaPipe detects 33 body points. Each has:
- `x` — horizontal position (0.0 = left edge, 1.0 = right edge)
- `y` — vertical position (0.0 = top, 1.0 = bottom)
- `z` — depth relative to the hip midpoint (negative = closer to camera)
- `visibility` — confidence score (0.0–1.0)

```
        0: nose
       / \
     7: ear  8: ear
     |         |
    11: L shoulder --- 12: R shoulder
     |                  |
    13: L elbow     14: R elbow
     |                  |
    15: L wrist     16: R wrist
     |                  |
    23: L hip    --- 24: R hip
     |                  |
    25: L knee      26: R knee
     |                  |
    27: L ankle     28: R ankle
```

We only use 12 of these (defined in `src/lib/pose/landmarks.ts`).

### Angle calculation

The core math: given 3 landmarks A, B, C, what's the angle at B?

```
    A
   /
  / angle
 B --------C
```

Uses the dot product formula:
```
cos(angle) = (BA · BC) / (|BA| × |BC|)
angle = acos(result) × 180 / PI
```

This lives in `calculateAngle()` in `src/lib/pose/angles.ts`.

### The rep counter state machine

```
          angle >= 150°
idle ─────────────────────> ready
                              |
                              | angle drops below 150°
                              v
                            down
                              |
                              | angle reaches ≤ 100°
                              v
                           bottom
                              |
                              | angle rises above 100°
                              v
                             up
                              |
                              | angle reaches 150° → COUNT++
                              v
                            ready (cycle repeats)
```

Thresholds are configurable per exercise via `RepCounterConfig`:
- `readyAngle` — angle at the starting position (default: 160°)
- `bottomAngle` — angle at full range of motion (default: 90°)
- `hysteresis` — buffer to prevent flickering (default: 10°)

The actual transition thresholds become:
- Ready → Down: angle drops below `readyAngle - hysteresis` (150°)
- Down → Bottom: angle reaches `bottomAngle + hysteresis` (100°)

### Smoothing

Raw angles are noisy frame-to-frame. Exponential moving average smooths them:

```
smoothed = previous + factor × (current - previous)
```

`SMOOTHING_FACTOR = 0.4` — lower = smoother but more latency, higher = more responsive but jittery.

### Bilateral averaging

Instead of tracking just one arm/leg, we average left + right landmarks:
```ts
const shoulder = averageLandmarks(leftShoulder, rightShoulder)
```
This makes detection work regardless of which side faces the camera.

---

## Current exercise processors

| File | Exercise type | Landmarks used | Angle measured |
|------|--------------|----------------|----------------|
| `pushup.ts` | Push-ups | Shoulder → Elbow → Wrist | Elbow bend |
| `squat.ts` | Squats | Hip → Knee → Ankle | Knee bend |
| `plank.ts` | Plank holds | Shoulder → Hip → Ankle | Body alignment (180° = straight) |

**Pull exercises are missing a dedicated processor.** Currently, `pull` category falls back to `createPushupProcessor()` in `WorkoutView.tsx:57` — which tracks elbow angle. This works partially for inverted rows but isn't ideal.

---

## How to add a new exercise processor

### Step 1: Identify the right landmarks and angle

Think about what body joint defines the exercise motion:

| Exercise | Joint to track | Landmark triplet (A → B → C) |
|----------|---------------|-------------------------------|
| Pull-up | Elbow (from above) | Hip → Shoulder → Elbow |
| Inverted row | Elbow (rowing) | Shoulder → Elbow → Wrist |
| Lunge | Front knee | Hip → Knee → Ankle |
| Shoulder press | Shoulder/elbow | Hip → Shoulder → Wrist |
| Dip | Elbow | Shoulder → Elbow → Wrist |

For pull-ups, the elbow angle alone doesn't capture the motion well because the arms
are overhead. A better approach: track the **shoulder angle** (hip → shoulder → elbow),
which goes from ~180° (hanging) to ~60° (chin over bar).

### Step 2: Create the processor file

Create `src/lib/pose/exercises/pullup.ts` following the pushup pattern:

```ts
import type { Landmark } from '../landmarks'
import { POSE } from '../landmarks'
import { calculateAngle, smoothAngle, averageLandmarks } from '../angles'
import { RepCounter, type RepPhase } from '../rep-counter'

// Tune these by logging actual angles while doing the exercise.
// The shoulder angle (hip-shoulder-elbow) for pull-ups:
//   - Hanging (arms extended): ~170°
//   - Top position (chin above bar): ~50°
const PULLUP_CONFIG = {
  readyAngle: 160,   // arms mostly extended
  bottomAngle: 70,   // arms pulled up (angle DECREASES going up)
  hysteresis: 10,
} as const

const SMOOTHING_FACTOR = 0.4

export interface PullupFrameResult {
  angle: number
  repCount: number
  phase: RepPhase
  repCompleted: boolean
}

export function createPullupProcessor() {
  const counter = new RepCounter(PULLUP_CONFIG)
  let smoothedAngle = 0
  let initialized = false

  return {
    processFrame(landmarks: Landmark[]): PullupFrameResult {
      // For pull-ups: measure shoulder angle (hip → shoulder → elbow)
      const hip = averageLandmarks(
        landmarks[POSE.LEFT_HIP],
        landmarks[POSE.RIGHT_HIP]
      )
      const shoulder = averageLandmarks(
        landmarks[POSE.LEFT_SHOULDER],
        landmarks[POSE.RIGHT_SHOULDER]
      )
      const elbow = averageLandmarks(
        landmarks[POSE.LEFT_ELBOW],
        landmarks[POSE.RIGHT_ELBOW]
      )

      const rawAngle = calculateAngle(hip, shoulder, elbow)

      if (!initialized) {
        smoothedAngle = rawAngle
        initialized = true
      } else {
        smoothedAngle = smoothAngle(rawAngle, smoothedAngle, SMOOTHING_FACTOR)
      }

      const result = counter.update(smoothedAngle)

      return {
        angle: smoothedAngle,
        repCount: result.count,
        phase: result.phase,
        repCompleted: result.repCompleted,
      }
    },

    reset() {
      counter.reset()
      smoothedAngle = 0
      initialized = false
    },

    get count() {
      return counter.count
    },
  }
}
```

### Step 3: Wire it into WorkoutView

In `src/features/workout/WorkoutView.tsx`, add the import and map `pull` to the new processor:

```ts
import { createPullupProcessor } from '@/lib/pose/exercises/pullup'

// Update the type union:
type ExerciseProcessor = ReturnType<typeof createPushupProcessor>
  | ReturnType<typeof createSquatProcessor>
  | ReturnType<typeof createPullupProcessor>

// In ensureProcessor() and handleNextExercise(), replace the else fallback:
if (cat === 'squat') {
  repProcessorRef.current = createSquatProcessor()
} else if (cat === 'pull') {
  repProcessorRef.current = createPullupProcessor()
} else {
  repProcessorRef.current = createPushupProcessor()
}
```

This change needs to happen in two places in WorkoutView.tsx:
1. `ensureProcessor()` (~line 54)
2. `handleNextExercise()` (~line 110)

### Step 4: Write tests

Create `src/lib/pose/__tests__/pullup.test.ts`. Follow the pattern in `rep-counter.test.ts`
but feed angle sequences that simulate a pull-up motion:

```ts
import { describe, it, expect } from 'vitest'
import { createPullupProcessor } from '../exercises/pullup'
import type { Landmark } from '../landmarks'

// Helper: build a 33-landmark array with specific shoulder angles
function makePullupLandmarks(shoulderAngleDeg: number): Landmark[] {
  // Position landmarks so hip-shoulder-elbow produces the desired angle.
  // Simplest approach: fix hip and shoulder, vary elbow position.
  const lms: Landmark[] = Array(33).fill(null).map(() => ({
    x: 0.5, y: 0.5, z: 0, visibility: 1,
  }))

  // Fixed positions for hips and shoulders
  lms[23] = { x: 0.4, y: 0.7, z: 0, visibility: 1 }  // L hip
  lms[24] = { x: 0.6, y: 0.7, z: 0, visibility: 1 }  // R hip
  lms[11] = { x: 0.4, y: 0.4, z: 0, visibility: 1 }  // L shoulder
  lms[12] = { x: 0.6, y: 0.4, z: 0, visibility: 1 }  // R shoulder

  // Elbow position based on desired angle
  // angle = 180° → elbow directly above shoulder (y = 0.1)
  // angle = 60°  → elbow pulled back/down
  const rad = (shoulderAngleDeg * Math.PI) / 180
  const elbowY = 0.4 - 0.3 * Math.cos(rad)  // varies with angle
  const elbowX = 0.5 + 0.3 * Math.sin(rad)
  lms[13] = { x: elbowX - 0.1, y: elbowY, z: 0, visibility: 1 }  // L elbow
  lms[14] = { x: elbowX + 0.1, y: elbowY, z: 0, visibility: 1 }  // R elbow

  // Wrists (not used by pullup processor but must exist)
  lms[15] = { x: 0.3, y: 0.3, z: 0, visibility: 1 }
  lms[16] = { x: 0.7, y: 0.3, z: 0, visibility: 1 }

  return lms
}

describe('PullupProcessor', () => {
  it('counts a full pull-up rep', () => {
    const processor = createPullupProcessor()

    // Start: arms extended (high angle)
    processor.processFrame(makePullupLandmarks(170))  // idle → ready

    // Pull up: angle decreases
    processor.processFrame(makePullupLandmarks(140))  // ready → down
    processor.processFrame(makePullupLandmarks(100))
    processor.processFrame(makePullupLandmarks(70))   // down → bottom

    // Lower back down: angle increases
    processor.processFrame(makePullupLandmarks(100))  // bottom → up
    const result = processor.processFrame(makePullupLandmarks(160))  // up → ready

    expect(result.repCompleted).toBe(true)
    expect(processor.count).toBe(1)
  })
})
```

### Step 5: Tune thresholds

The hardest part. The default angles (160°/70°) are guesses. To get real values:

**Option A: Add a debug overlay (recommended)**

Temporarily modify `WorkoutHUD.tsx` to display the live angle:

```tsx
// In the WorkoutHUD component, add somewhere visible:
<span className="workout-hud__target">
  Angle: {currentAngle.toFixed(0)}°
</span>
```

You'd need to pass the angle through from the processor. Do the exercise in front of
the camera and note:
- What angle shows when you're in the starting position → set as `readyAngle`
- What angle shows at full range of motion → set as `bottomAngle`
- Subtract 10° from each for the hysteresis buffer

**Option B: Console logging**

Add a `console.log` in the processor's `processFrame`:
```ts
console.log(`angle: ${smoothedAngle.toFixed(1)}° phase: ${result.phase}`)
```

Do a few reps and check the browser console for the angle range.

---

## Adding a completely new landmark triplet

If an exercise uses landmarks not in `POSE`, add them to `src/lib/pose/landmarks.ts`:

```ts
export const POSE = {
  // ... existing entries ...
  LEFT_PINKY: 17,     // example
  RIGHT_PINKY: 18,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const
```

Full landmark list: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker

If you add new connections for skeleton rendering, update `SKELETON_CONNECTIONS` too.

---

## MediaPipe configuration options

These are set in `src/lib/pose/mediapipe.ts` and affect detection quality:

```ts
PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: MODEL_CDN,  // which model to use
    delegate: 'GPU',            // 'GPU' or 'CPU'
  },
  runningMode: 'VIDEO',
  numPoses: 1,                        // only detect 1 person
  minPoseDetectionConfidence: 0.5,    // lower = more detections, more noise
  minPosePresenceConfidence: 0.5,     // lower = keeps tracking with less certainty
  minTrackingConfidence: 0.5,         // lower = less likely to lose tracking
})
```

### Model variants

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| `pose_landmarker_lite` (current) | ~3MB | Fastest | Good enough for most |
| `pose_landmarker_full` | ~6MB | Slower | Better for tricky angles |
| `pose_landmarker_heavy` | ~16MB | Slowest | Best accuracy |

To switch models, change `MODEL_CDN` in `mediapipe.ts`:
```ts
// Replace 'pose_landmarker_lite' with 'pose_landmarker_full':
const MODEL_CDN = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'
```

### Delegate options

- `'GPU'` — Uses WebGL. Faster on most phones and laptops.
- `'CPU'` — Fallback. Use if GPU detection fails on some devices.

---

## Quick reference: file map

```
src/lib/pose/
  landmarks.ts          ← Landmark type + POSE indices + skeleton connections
  angles.ts             ← calculateAngle(), smoothAngle(), averageLandmarks()
  rep-counter.ts        ← RepCounter class (generic state machine)
  mediapipe.ts          ← PoseDetector class (WASM/model loading, rAF loop)
  exercises/
    pushup.ts           ← Push-up processor (elbow angle)
    squat.ts            ← Squat processor (knee angle)
    plank.ts            ← Plank processor (body alignment + timer)
    pullup.ts           ← (ADD THIS) Pull-up processor (shoulder angle)
  __tests__/
    angles.test.ts      ← 11 tests
    rep-counter.test.ts ← 9 tests
    plank.test.ts       ← 6 tests

src/features/workout/
  WorkoutView.tsx       ← Orchestrator: maps category → processor, wires landmarks
  CameraView.tsx        ← Camera + MediaPipe lifecycle
  WorkoutHUD.tsx        ← Live rep/timer overlay
  ...
```

---

## Useful links

- [Pose Landmarker guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
- [All 33 landmark indices](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker#pose_landmarker_model)
- [@mediapipe/tasks-vision npm](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- [MediaPipe model zoo](https://storage.googleapis.com/mediapipe-models/) (all available models)
