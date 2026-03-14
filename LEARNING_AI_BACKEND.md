# Learning Path: Front-End Developer to AI Product Engineer

A practical guide anchored in what you've already built with CalisthenIQ. Each section connects industry concepts to hands-on code you can touch in this repo.

---

## Part 1: Backend Fundamentals (Language-Agnostic)

### What You Already Know (From This App)

You're already using serverless functions (`netlify/functions/`), blob storage, and REST endpoints. That's a backend. The concepts below formalize what you're doing intuitively.

### Your Current Backend Architecture

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│                                                     │
│  Next.js App                                        │
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐  │
│  │ React UI │──▶│ API Layer│──▶│ fetch() calls  │──┼──┐
│  │ (hooks)  │   │ client.ts│   │ GET/POST       │  │  │
│  └──────────┘   └──────────┘   └────────────────┘  │  │
│                                                     │  │
│  ┌──────────────────────────┐                       │  │
│  │ MediaPipe (on-device ML) │  ← no backend needed  │  │
│  └──────────────────────────┘                       │  │
└─────────────────────────────────────────────────────┘  │
                                                         │
                        HTTPS                            │
                                                         │
┌─────────────────────────────────────────────────────┐  │
│                 NETLIFY (Backend)                    │  │
│                                                     │◀─┘
│  ┌─────────────────┐    ┌──────────────────────┐    │
│  │ Serverless Funcs │──▶│ Netlify Blob Storage │    │
│  │ (Node.js)       │    │ (JSON documents)     │    │
│  │                 │    │                      │    │
│  │ /api/user-data  │    │ userData.json        │    │
│  │ /api/log-session│    │ sessions/[id].json   │    │
│  │ /api/seed       │    │ exercises.json       │    │
│  └─────────────────┘    └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Core Concepts

**Request-Response Cycle**

```
Client                          Server
  │                               │
  │  ── GET /api/user-data ────▶  │  1. Client sends request
  │                               │  2. Server processes
  │  ◀── 200 { levels, ... } ──  │  3. Server responds
  │                               │
  │  ── POST /api/log-session ─▶  │  1. Client sends data
  │     { session: {...} }        │  2. Server validates & stores
  │  ◀── 201 Created ──────────  │  3. Server confirms
  │                               │
  │  ── GET /api/missing ──────▶  │  1. Client requests
  │  ◀── 404 Not Found ────────  │  3. Resource doesn't exist
```

- HTTP methods (GET, POST, PUT, DELETE) map to CRUD operations
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error
- Headers, body, query params — you already send these from `src/api/client.ts`
- *In your app*: `api.user.getUserData()` is a GET, `api.user.logSession()` is a POST

**REST vs GraphQL vs tRPC**
- REST: resource-based URLs (`/api/users/123/sessions`). What you use now
- GraphQL: single endpoint, client specifies exact data shape. Reduces over-fetching
- tRPC: end-to-end type safety between TypeScript frontend and backend. No API schema needed
- *Practical next step*: tRPC fits your stack naturally (Next.js + TypeScript)

**Databases**

```
SQL (Relational)                    NoSQL (Document) ← what you use
┌──────────────────────┐            ┌──────────────────────┐
│ users                │            │ userData.json         │
│ ┌────┬───────┬─────┐ │            │ {                     │
│ │ id │ name  │ lvl │ │            │   "levels": {         │
│ ├────┼───────┼─────┤ │            │     "pushup": 3,      │
│ │ 1  │ Rein  │ 3   │ │            │     "squat": 2        │
│ └────┴───────┴─────┘ │            │   },                  │
│                      │            │   "sessions": [...],   │
│ sessions             │            │   "gates": {...}       │
│ ┌────┬─────┬───────┐ │            │ }                     │
│ │ id │ uid │ date  │ │            └──────────────────────┘
│ ├────┼─────┼───────┤ │
│ │ 1  │ 1   │ 03-14 │ │            Key-Value / Document:
│ └────┴─────┴───────┘ │            One big JSON blob per user
│                      │            Simple, flexible, no schema
│ Structured tables    │            ─────────────────────────
│ with relationships   │            Your Netlify Blobs work
│ (foreign keys)       │            this way
└──────────────────────┘
```

- SQL (PostgreSQL, MySQL): structured tables, relationships, ACID transactions. Best for structured data like your user levels, sessions, exercise definitions
- NoSQL (MongoDB, DynamoDB): flexible documents. Similar to your Netlify Blob JSON storage
- *In your app*: Netlify Blobs store JSON documents — conceptually a key-value/document store
- *Upgrade path*: Supabase (PostgreSQL + auth + realtime) or PlanetScale (MySQL) for production

**Authentication & Authorization**

```
                    Authentication              Authorization
                    "Who are you?"              "What can you do?"

                    ┌─────────────┐             ┌─────────────────┐
  Login ──────────▶ │ Verify      │ ──────────▶ │ Check           │
  (email/password   │ Identity    │   Token     │ Permissions     │
   or OAuth)        │             │   (JWT)     │                 │
                    └─────────────┘             └─────────────────┘

  JWT Token Structure:
  ┌──────────────────────────────────────────────┐
  │ Header    │ { alg: "HS256", typ: "JWT" }     │
  │ Payload   │ { userId: 123, exp: 17... }      │
  │ Signature │ HMAC(header + payload, secret)    │
  └──────────────────────────────────────────────┘
  Stateless: server doesn't store sessions, just verifies the signature
```

- Authentication = who are you? (login)
- Authorization = what can you do? (permissions)
- JWT (JSON Web Tokens): stateless auth tokens. Most common for APIs
- OAuth 2.0: "Sign in with Google/GitHub". Delegates auth to a provider
- *In your app*: no auth yet — adding Supabase Auth or Clerk would be a strong backend exercise

**Server Architecture Patterns**

```
Monolith                Serverless (You)           Microservices
┌──────────────┐       ┌──────────────────┐       ┌──────┐ ┌──────┐ ┌──────┐
│ All code in  │       │ Function A ──┐   │       │ User │ │ Work │ │ Auth │
│ one process  │       │ Function B ──┤   │       │ Svc  │ │ Svc  │ │ Svc  │
│              │       │ Function C ──┘   │       │      │ │      │ │      │
│ Always       │       │                  │       │      │ │      │ │      │
│ running      │       │ Spin up on       │       └──┬───┘ └──┬───┘ └──┬───┘
│              │       │ request, die     │          │        │        │
│ Scale: buy   │       │ after            │          ▼        ▼        ▼
│ bigger       │       │                  │       ┌──────────────────────┐
│ server       │       │ Scale: auto      │       │   Message Bus / API  │
└──────────────┘       └──────────────────┘       │   Gateway            │
                                                  └──────────────────────┘
Simple, good           Pay-per-use, auto-         Complex, independent
starting point         scaling. Your setup.       deployment. Overkill
                                                  for most apps.
```

- *Key insight*: serverless is already a production architecture pattern, not a toy

**Caching, Queues, Background Jobs**

```
Without Cache                    With Cache (Redis/CDN)
┌──────┐    ┌──────┐             ┌──────┐    ┌───────┐    ┌──────┐
│Client│──▶│Server│             │Client│──▶│ Cache │──▶│Server│
│      │◀──│ 200ms│             │      │◀──│  5ms  │    │      │
└──────┘    └──────┘             └──────┘    └───────┘    └──────┘
Every request hits               Cache hit = fast         Cache miss =
the database                     No DB query              fill cache, then respond

Message Queue Pattern
┌──────────┐    ┌───────────┐    ┌──────────────┐
│ API call │──▶│  Queue    │──▶│ Worker       │
│ "process │    │ (SQS,    │    │ (processes   │
│  video"  │    │  Redis)  │    │  when ready) │
└──────────┘    └───────────┘    └──────────────┘
Returns immediately              Runs in background
User doesn't wait                Can retry on failure
```

- *In your app*: your 500ms debounce on draft saves is a client-side queue pattern

### Resources
- [HTTP crash course](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) — MDN
- [Supabase docs](https://supabase.com/docs) — Postgres + Auth + Realtime for JS devs
- [tRPC docs](https://trpc.io/docs) — end-to-end typesafe APIs
- Book: "Designing Data-Intensive Applications" by Martin Kleppmann (the backend bible)

---

## Part 2: AI/ML Fundamentals

### What You Already Know (From This App)

You're running a neural network (MediaPipe PoseLandmarker) in the browser, processing its output (33 landmarks per frame), and building domain logic on top (rep counting state machines). That's applied ML engineering.

### Core Concepts

**Models, Training, and Inference**

```
TRAINING (Google did this)                 INFERENCE (Your app does this)
┌─────────────────────────────┐           ┌─────────────────────────────┐
│                             │           │                             │
│  Labeled Images             │           │  Live Video Frame           │
│  ┌─────┐ ┌─────┐ ┌─────┐   │           │  ┌─────────────┐           │
│  │  🏃  │ │ 🧘  │ │ 💪  │   │           │  │  Camera      │           │
│  │     │ │     │ │     │   │           │  │  Feed        │           │
│  │label│ │label│ │label│   │           │  └──────┬──────┘           │
│  └──┬──┘ └──┬──┘ └──┬──┘   │           │         │                  │
│     │       │       │      │           │         ▼                  │
│     ▼       ▼       ▼      │           │  ┌─────────────┐           │
│  ┌──────────────────────┐  │           │  │ Pre-trained  │           │
│  │ Neural Network       │  │           │  │ Model        │           │
│  │ adjusts weights      │  │    ────▶  │  │ (frozen      │           │
│  │ over millions of     │  │   model   │  │  weights)    │           │
│  │ iterations           │  │   file    │  └──────┬──────┘           │
│  └──────────────────────┘  │           │         │                  │
│                             │           │         ▼                  │
│  Output: model weights      │           │  33 Landmarks              │
│  (.tflite file)             │           │  with x, y, z, visibility  │
└─────────────────────────────┘           └─────────────────────────────┘
```

- A model is a function: input → output, learned from data
- Training: feeding labeled data to adjust model weights (you don't do this — Google did it for PoseLandmarker)
- Inference: running a trained model on new data (this is what your app does every frame)
- *In your app*: `PoseDetector.create()` loads a pre-trained model, `detector.start(video)` runs inference

**Supervised vs Unsupervised Learning**
- Supervised: labeled data (input + correct answer). Image classification, pose detection
- Unsupervised: find patterns without labels. Clustering, anomaly detection
- Reinforcement learning: learn by trial and error with rewards. Game AI, robotics
- *PoseLandmarker was trained supervised*: thousands of images with manually labeled joint positions

**Neural Networks**

```
Simple Neural Network                    CNN (What PoseLandmarker Uses)

Input    Hidden Layers    Output         ┌─────────────────────────────────┐
                                         │ Image                           │
 o ──┐   ┌── o ──┐   ┌── o              │ ┌───┬───┬───┬───┐              │
     ├──▶│       ├──▶│                   │ │   │   │   │   │              │
 o ──┤   ├── o ──┤   ├── o              │ ├───┼───┼───┼───┤              │
     ├──▶│       ├──▶│                   │ │   │   │   │   │  Convolution │
 o ──┤   ├── o ──┤   ├── o              │ └───┴───┴───┴───┘  layers scan │
     ├──▶│       ├──▶│                   │         │          with small   │
 o ──┘   └── o ──┘   └── o              │         ▼          filters      │
                                         │  Feature Maps                   │
Each connection has a                    │  (edges, shapes, body parts)    │
"weight" (learned number).               │         │                       │
                                         │         ▼                       │
Input × weights + bias                  │  Dense Layers                   │
  → activation function                  │  (combine features)             │
  → next layer                           │         │                       │
                                         │         ▼                       │
                                         │  33 Landmark coordinates        │
                                         └─────────────────────────────────┘
```

- Layers of interconnected nodes that transform input to output
- CNNs (Convolutional Neural Networks): specialized for images/video. Used in pose detection
- Transformers: attention-based architecture. Powers LLMs (GPT, Claude), also used in vision
- *In your app*: PoseLandmarker uses a CNN to detect body keypoints from video frames

**Key Terminology**
- Weights/parameters: the learned values inside a model (millions to billions)
- Embeddings: dense vector representations of data (words, images, users)
- Tokens: chunks of text that LLMs process (roughly 4 chars per token)
- Latency: time from input to output. Critical for real-time apps like yours
- Confidence/visibility: how sure the model is about a prediction — you use `landmark.visibility`

**Accuracy vs Performance Tradeoffs**

```
                    Accuracy
                       ▲
                       │
          Heavy ───────┤ ● best accuracy, 5-10 fps
                       │
           Full ───────┤     ● balanced
                       │
           Lite ───────┤         ● fastest, 15-30 fps
                       │
                       └──────────────────────▶ Speed

Quantization: float32 ──▶ int8
┌────────────────────┐     ┌──────────────┐
│ 3.14159265         │     │ 3            │
│ precise but slow   │     │ less precise │
│ 4 bytes per weight │     │ but 4x less  │
│                    │     │ memory, faster│
└────────────────────┘     └──────────────┘
```

- Larger models = more accurate but slower
- Quantization: reduce precision (float32 → int8) for speed. MediaPipe uses this
- Distillation: train a small model to mimic a large one
- *In your app*: MediaPipe's "lite" model trades some accuracy for real-time performance on mobile

### How Your Rep Counting Connects

Your pose processors (`src/lib/pose/exercises/pushup.ts`) are a textbook example of **signal processing on ML output**:

```
┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌────────────┐
│  Video   │    │  ML Model    │    │   Feature     │    │    State     │    │  Business  │
│  Frame   │──▶│ PoseLandmark │──▶│  Extraction   │──▶│   Machine    │──▶│   Logic    │
│          │    │  er          │    │  (angles)     │    │              │    │            │
│ 30 fps   │    │ 33 landmarks │    │ elbow: 145°  │    │ idle         │    │ repCount++ │
│          │    │ x,y,z,vis   │    │ knee: 170°   │    │  ↓ ready     │    │ targetMet? │
│          │    │              │    │ hip: 160°    │    │  ↓ down      │    │ save()     │
│          │    │              │    │              │    │  ↓ bottom    │    │            │
│          │    │              │    │              │    │  ↓ up → +1   │    │            │
└──────────┘    └──────────────┘    └───────────────┘    └──────────────┘    └────────────┘
```

This pipeline pattern (raw data → ML inference → post-processing → business logic) is the same pattern used in:
- Self-driving cars (camera → object detection → path planning → steering)
- Voice assistants (audio → speech-to-text → intent classification → response)
- Content moderation (image → classification → policy rules → action)

### Resources
- [3Blue1Brown Neural Networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi) — visual intuition
- [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) — free, practical
- [fast.ai](https://www.fast.ai/) — top-down practical ML course
- [Andrej Karpathy's "Neural Networks: Zero to Hero"](https://karpathy.ai/zero-to-hero.html) — build from scratch

---

## Part 3: MediaPipe & On-Device AI (Deep Dive)

### What You're Using

Your app uses `@mediapipe/tasks-vision` with PoseLandmarker. Here's what's happening under the hood.

### The MediaPipe Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     MediaPipe Pipeline                          │
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │  Video   │   │    Image     │   │   Person     │            │
│  │  Frame   │──▶│ Preprocess   │──▶│  Detection   │            │
│  │          │   │              │   │              │            │
│  │ 1920x1080│   │ resize to    │   │ find human   │            │
│  │ RGB      │   │ 256x256      │   │ bounding box │            │
│  └──────────┘   │ normalize    │   └──────┬───────┘            │
│                 │ 0.0 - 1.0    │          │                    │
│                 └──────────────┘          │                    │
│                                          ▼                    │
│                 ┌──────────────┐   ┌──────────────┐            │
│                 │   Output     │   │    Pose      │            │
│                 │              │◀──│  Estimation   │            │
│                 │ Landmark[]   │   │              │            │
│                 │ 33 points    │   │ CNN predicts │            │
│                 │ x,y,z,vis   │   │ 33 keypoints │            │
│                 │ normalized   │   │ within bbox  │            │
│                 │ [0..1]       │   │              │            │
│                 └──────────────┘   └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘

The 33 Landmarks:
          0 (nose)
         / \
    11 ─┤   ├─ 12        (shoulders)
    13 ─┤   ├─ 14        (elbows)
    15 ─┤   ├─ 16        (wrists)
        │   │
    23 ─┤   ├─ 24        (hips)
    25 ─┤   ├─ 26        (knees)
    27 ─┤   ├─ 28        (ankles)

Your app uses these indices in SKELETON_CONNECTIONS
to draw the overlay and calculate joint angles.
```

### Delegates: How Inference Runs

```
┌─────────────────────────────────────────────────┐
│              Inference Delegates                 │
│                                                  │
│  CPU (WASM)          GPU (WebGL)    WASM SIMD    │
│  ┌─────────┐        ┌─────────┐   ┌─────────┐  │
│  │ JS/WASM │        │ WebGL   │   │ WASM +  │  │
│  │         │        │ Shaders │   │ Vector  │  │
│  │ ~60ms   │        │         │   │ Ops     │  │
│  │ per     │        │ ~15ms   │   │         │  │
│  │ frame   │        │ per     │   │ ~30ms   │  │
│  │         │        │ frame   │   │ per     │  │
│  │ Works   │        │         │   │ frame   │  │
│  │ every-  │        │ Needs   │   │         │  │
│  │ where   │        │ WebGL2  │   │ Needs   │  │
│  │         │        │         │   │ SIMD    │  │
│  └─────────┘        └─────────┘   └─────────┘  │
│  Slowest,            Fastest,      Good          │
│  most compatible     GPU required  middle ground │
└─────────────────────────────────────────────────┘
```

- *In your app*: `PoseDetector.create()` in `src/lib/pose/mediapipe.ts` loads the WASM runtime

### Model Variants
- **Lite**: smallest, fastest, least accurate. Good for real-time mobile
- **Full**: balanced accuracy and speed
- **Heavy**: most accurate, slower. Good for offline processing
- *Your choice matters*: on mobile, lite model at 15-30fps vs heavy model at 5-10fps

### On-Device vs Cloud Inference

```
ON-DEVICE (Your App)                     CLOUD API
┌──────────────────────┐                ┌──────────────────────┐
│  Browser / Phone     │                │  Browser / Phone     │
│  ┌────────────────┐  │                │                      │
│  │ Video ──▶ Model│  │                │  Video ──┐           │
│  │        ◀── 33  │  │                │          │ upload    │
│  │       landmarks│  │                │          ▼           │
│  └────────────────┘  │                │  ┌──────────────┐    │
│                      │                │  │   Internet   │    │
│  Latency: ~30ms     │                │  └──────┬───────┘    │
│  Privacy: stays      │                │         │            │
│    on device         │                │         ▼            │
│  Cost: FREE          │                │  ┌──────────────┐    │
│  Offline: YES        │                │  │ Cloud Server │    │
│  Model size: limited │                │  │ Big Model    │    │
│                      │                │  │ 100-500ms    │    │
└──────────────────────┘                │  └──────┬───────┘    │
                                        │         │            │
                                        │    ◀────┘ results    │
                                        │                      │
                                        │  Latency: 100-500ms  │
                                        │  Privacy: data sent  │
                                        │  Cost: per API call  │
                                        │  Offline: NO         │
                                        │  Model size: any     │
                                        └──────────────────────┘
```

*Your app chose on-device for good reasons*: real-time pose detection needs <50ms latency, privacy-sensitive (body video), and zero marginal cost per user.

### Beyond Pose Detection — Other MediaPipe Tasks
- **Hand Landmark Detection**: 21 hand keypoints. Use case: gesture controls
- **Face Landmark Detection**: 468 face mesh points. Use case: AR filters
- **Object Detection**: bounding boxes + labels. Use case: equipment recognition
- **Image Segmentation**: pixel-level classification. Use case: background removal
- **Text Classification**: sentiment, categories. Use case: workout note analysis

### Practical Extension Ideas for Your App
1. **Hand tracking for counting**: detect hand raise as "set complete" gesture
2. **Face detection for engagement**: detect if user is looking at screen during rest
3. **Multi-pose**: detect workout partner, compare form side-by-side
4. **Custom model**: train a TFLite model on exercise-specific form quality (good form vs bad form)

### Resources
- [MediaPipe Solutions Guide](https://ai.google.dev/edge/mediapipe/solutions/guide) — official docs
- [MediaPipe Model Cards](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) — understand model accuracy/limitations
- [TensorFlow Lite for Web](https://www.tensorflow.org/lite/guide) — the runtime your models use
- [MediaPipe GitHub](https://github.com/google-ai-edge/mediapipe) — source code and examples

---

## Part 4: LLMs & AI Product Engineering

### The Industry Shift You're Entering

AI product engineering is about integrating ML capabilities into products — not building models from scratch. You don't need a PhD. You need to understand APIs, patterns, and tradeoffs.

### LLM APIs — The Building Blocks

**Major Providers**
- **Anthropic Claude API**: strong reasoning, tool use, long context (200K tokens)
- **OpenAI GPT API**: broad ecosystem, function calling, vision
- **Google Gemini API**: multimodal (text + image + video), long context (1M+ tokens)
- **Open-source (Llama, Mistral)**: self-hosted, no API costs, full control

**How an LLM API Call Works**

```
Your App                              LLM Provider (e.g. Anthropic)
┌────────────────────────┐            ┌────────────────────────────┐
│                        │            │                            │
│ const response = await │            │  ┌──────────────────────┐  │
│   anthropic.messages   │            │  │ 1. Tokenize input    │  │
│     .create({          │  ────────▶ │  │ 2. Run transformer   │  │
│       model: "claude", │   POST     │  │    (billions of      │  │
│       system: "You are │   HTTPS    │  │     matrix ops)      │  │
│         a fitness      │            │  │ 3. Sample next token │  │
│         coach",        │            │  │ 4. Repeat until done │  │
│       messages: [      │            │  └──────────────────────┘  │
│         { role: "user",│            │                            │
│           content:     │            │  Tokens In:  ~$3/million   │
│           "Analyze my  │            │  Tokens Out: ~$15/million  │
│            workout" }  │  ◀──────── │                            │
│       ]                │  Response  │  "Based on your session    │
│     })                 │  (stream)  │   data, you improved..."  │
│                        │            │                            │
└────────────────────────┘            └────────────────────────────┘
```

**Key API Concepts**
- System prompt: persistent instructions that shape behavior
- Messages array: conversation history (role: user/assistant/system)
- Temperature: randomness control (0 = deterministic, 1 = creative)
- Max tokens: output length limit
- Streaming: receive response token-by-token instead of waiting for completion

**Cost Awareness**
- Input tokens are cheaper than output tokens
- Claude Sonnet: ~$3/M input, ~$15/M output tokens
- A typical API call costs $0.001-$0.05
- Cache system prompts to reduce repeated costs

### Prompt Engineering Patterns

**Few-Shot Prompting**: include examples in the prompt
```
Classify this exercise form:
Good: "elbows at 90 degrees, back straight, full range of motion"
Bad: "elbows flared, partial range, arched back"
Classify: "arms at 45 degrees, back straight, touched chest" →
```

**Chain of Thought**: ask the model to reason step-by-step
```
Analyze this workout session step by step:
1. First, check if each exercise met its target
2. Then, calculate the overall completion percentage
3. Finally, determine if the gate check passes
```

**Structured Output**: request JSON responses
```
Return a JSON object with: { score: number, feedback: string, improvements: string[] }
```

### RAG (Retrieval-Augmented Generation)

The most common AI product pattern. Instead of the LLM knowing everything, you retrieve relevant context and include it in the prompt.

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG Pipeline                              │
│                                                              │
│  User: "How do I improve my pushup form?"                   │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐     ┌──────────────────────────────────┐   │
│  │  Embedding   │     │  Vector Database                 │   │
│  │  Model       │     │  ┌──────┐ ┌──────┐ ┌──────┐     │   │
│  │              │────▶│  │ doc1 │ │ doc2 │ │ doc3 │     │   │
│  │  query ──▶   │     │  │ 0.92 │ │ 0.31 │ │ 0.87 │     │   │
│  │  [0.2, 0.8,  │     │  │match │ │      │ │match │     │   │
│  │   0.1, ...]  │     │  └──────┘ └──────┘ └──────┘     │   │
│  └─────────────┘     └──────────────┬───────────────────┘   │
│                                      │ top matches           │
│                                      ▼                       │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  LLM Prompt                                           │   │
│  │                                                       │   │
│  │  Context: [pushup guide doc, user's last 5 sessions]  │   │
│  │  Question: "How do I improve my pushup form?"         │   │
│  │                                                       │   │
│  │  ──▶ "Based on your recent sessions, your elbow       │   │
│  │       angle averages 120°. Aim for 90° at the         │   │
│  │       bottom position. Try tempo pushups..."          │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Components**:
- Vector database (Pinecone, Weaviate, pgvector): stores text as embeddings for semantic search
- Embedding model: converts text to vectors (OpenAI `text-embedding-3-small`)
- Retriever: finds relevant documents given a query
- Generator: LLM that produces the final answer

### Tool Use / Function Calling

```
┌─────────────────────────────────────────────────────────────┐
│                   Tool Use Flow                              │
│                                                              │
│  You define tools:                                           │
│  ┌────────────────────────────────────────────┐              │
│  │ { name: "get_workout_history",             │              │
│  │   description: "Get recent sessions",      │              │
│  │   parameters: { days: number } }           │              │
│  └────────────────────────────────────────────┘              │
│                                                              │
│  ┌────────┐         ┌─────────┐         ┌────────┐          │
│  │  User  │         │   LLM   │         │ Your   │          │
│  │        │         │         │         │ API    │          │
│  └───┬────┘         └────┬────┘         └───┬────┘          │
│      │                   │                  │               │
│      │ "How am I doing?" │                  │               │
│      │──────────────────▶│                  │               │
│      │                   │                  │               │
│      │                   │ tool_call:       │               │
│      │                   │ get_workout_     │               │
│      │                   │ history(days:7)  │               │
│      │                   │─────────────────▶│               │
│      │                   │                  │               │
│      │                   │  [session data]  │               │
│      │                   │◀─────────────────│               │
│      │                   │                  │               │
│      │ "You did 3        │                  │               │
│      │  sessions this    │                  │               │
│      │  week, up from 2" │                  │               │
│      │◀──────────────────│                  │               │
└─────────────────────────────────────────────────────────────┘
```

*In your app*: imagine an AI coach that can call `getUserData()`, analyze workout patterns, and give personalized advice using your existing API layer.

### Agent Architectures

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Loop (ReAct)                         │
│                                                              │
│   ┌──────────┐                                               │
│   │  Start   │                                               │
│   └────┬─────┘                                               │
│        │                                                     │
│        ▼                                                     │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│   │ Observe  │────▶│  Think   │────▶│   Act    │            │
│   │          │     │          │     │          │            │
│   │ read     │     │ reason   │     │ call     │            │
│   │ context  │     │ about    │     │ tool or  │            │
│   │          │     │ next     │     │ respond  │            │
│   │          │     │ step     │     │          │            │
│   └──────────┘     └──────────┘     └─────┬────┘            │
│        ▲                                   │                 │
│        │           ┌──────────┐            │                 │
│        │           │  Done?   │◀───────────┘                 │
│        │           └────┬─────┘                              │
│        │      No        │        Yes                         │
│        └────────────────┘         │                          │
│                              ┌────▼─────┐                    │
│                              │  Return  │                    │
│                              │  Answer  │                    │
│                              └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**Patterns**:
- ReAct: Reasoning + Acting. Model thinks out loud, then calls tools
- Planning: model creates a plan, then executes steps
- Multi-agent: specialized agents collaborate (researcher + coder + reviewer)

**Frameworks**:
- Vercel AI SDK: React-native streaming + tool calling. Fits your Next.js stack perfectly
- LangChain/LangGraph: Python/JS framework for chains and agents
- Claude Agent SDK: Anthropic's SDK for building agents with Claude
- OpenAI Assistants API: managed agent runtime with file search and code execution

### Evaluation & Testing AI Systems

```
Traditional Testing                AI Testing
┌─────────────────────┐           ┌─────────────────────────────┐
│                     │           │                             │
│ assert(add(2,3)===5)│           │ Is the response helpful?    │
│                     │           │ Is it factually correct?    │
│ Deterministic:      │           │ Does it match the tone?     │
│ same input =        │           │                             │
│ same output         │           │ Non-deterministic:          │
│ ALWAYS              │           │ same input =                │
│                     │           │ SIMILAR but different output│
│ Pass / Fail         │           │                             │
│                     │           │ Score: 0.0 - 1.0            │
│                     │           │ (averaged over many runs)   │
└─────────────────────┘           └─────────────────────────────┘

Evaluation Methods:
┌─────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────┐
│ Assertion   │  │ LLM-as-Judge  │  │ Human Eval   │  │ A/B Test │
│             │  │               │  │              │  │          │
│ Is it valid │  │ Another LLM   │  │ Real users   │  │ Compare  │
│ JSON?       │  │ scores the    │  │ rate quality │  │ v1 vs v2 │
│ Has all     │  │ output on     │  │              │  │ on live  │
│ fields?     │  │ criteria      │  │ Gold standard│  │ traffic  │
│             │  │               │  │ but expensive│  │          │
│ Cheapest    │  │ Scalable      │  │              │  │          │
└─────────────┘  └───────────────┘  └──────────────┘  └──────────┘
```

### MLOps Basics

```
┌─────────────────────────────────────────────────────────────┐
│                   ML Lifecycle in Production                  │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Build   │──▶│  Test    │──▶│  Deploy  │──▶│ Monitor  │ │
│  │          │   │          │   │          │   │          │ │
│  │ Select   │   │ Evaluate │   │ Ship to  │   │ Track    │ │
│  │ model    │   │ quality  │   │ prod     │   │ latency  │ │
│  │ Design   │   │ Run      │   │ Feature  │   │ cost     │ │
│  │ prompts  │   │ evals    │   │ flags    │   │ errors   │ │
│  │          │   │ Compare  │   │ Canary   │   │ quality  │ │
│  │          │   │ versions │   │ rollout  │   │ drift    │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│       ▲                                            │        │
│       │            Feedback Loop                   │        │
│       └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

- Model selection and benchmarking
- Prompt versioning (treat prompts like code)
- Monitoring: track latency, cost, error rates, user satisfaction
- Guardrails: content filtering, output validation, rate limiting
- Fallbacks: what happens when the AI service is down?

### Resources
- [Anthropic Claude API docs](https://docs.anthropic.com/) — tool use, streaming, prompt caching
- [Vercel AI SDK](https://sdk.vercel.ai/) — React hooks for AI (useChat, useCompletion)
- [Prompt Engineering Guide](https://www.promptingguide.ai/) — comprehensive patterns
- [Building LLM Apps (Chip Huyen)](https://huyenchip.com/2023/04/11/llm-engineering.html) — production patterns
- [LangChain docs](https://js.langchain.com/) — JS agent framework

---

## Part 5: Practical Project Ideas (Using Your App)

These projects build on your existing CalisthenIQ codebase, progressively adding backend and AI capabilities.

### Project 1: AI Workout Coach (LLM Integration)
**Skills**: LLM API, prompt engineering, streaming, Vercel AI SDK

```
┌─────────────────────────────────────────────┐
│  CalisthenIQ + AI Coach                      │
│                                              │
│  ┌──────────────────────────────┐            │
│  │  Home Page (existing)        │            │
│  │  ┌────────────────────────┐  │            │
│  │  │ Pushup  L3  [■■■□□]   │  │            │
│  │  │ Squat   L2  [■■□□□]   │  │            │
│  │  └────────────────────────┘  │            │
│  │                              │            │
│  │  ┌────────────────────────┐  │            │
│  │  │ AI Coach (new)         │  │            │
│  │  │                        │  │            │
│  │  │ "Great session! Your   │  │            │
│  │  │  pushup consistency    │  │            │
│  │  │  improved 20% this     │  │            │
│  │  │  week. Try adding a    │  │            │
│  │  │  1-sec pause at the    │  │            │
│  │  │  bottom to build       │  │            │
│  │  │  strength."            │  │            │
│  │  │                [Ask] ▶ │  │            │
│  │  └────────────────────────┘  │            │
│  └──────────────────────────────┘            │
└─────────────────────────────────────────────┘
```

- Create a Next.js API route that calls Claude API
- Pass user's session history as context
- Stream the response to a chat UI
- Use structured output for actionable suggestions

### Project 2: Exercise Form Scoring (On-Device ML + LLM)
**Skills**: feature engineering, custom ML pipeline, prompt engineering

```
During Camera Session:

┌─────────────────────────────────┐
│  Camera Feed                     │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │   Skeleton Overlay      │    │
│  │   + Angle Annotations   │    │
│  │                         │    │
│  │      elbow: 92°  ✓      │    │
│  │      back: 175°  ✓      │    │
│  │      depth: 85%  ⚠      │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                  │
│  Form Score: 87%                 │
│  Rep 4 / 10                      │
│  "Go a bit deeper on the next"  │
│                                  │
│  [Done]  [Cancel]                │
└─────────────────────────────────┘
```

- Extract joint angles per frame from landmarks (you already compute these)
- Define "ideal" angle ranges for each exercise phase
- Score deviation from ideal as a percentage
- Use an LLM to generate natural language feedback from the scores

### Project 3: Supabase Backend Migration
**Skills**: SQL, auth, real-time, row-level security

```
Current                              After Migration
┌────────────────┐                  ┌────────────────────────┐
│ Netlify Blobs  │                  │ Supabase               │
│                │                  │                        │
│ userData.json  │    ──────▶      │ ┌──────────────────┐   │
│ (one big blob) │                  │ │ users            │   │
│                │                  │ │ sessions         │   │
│ No auth        │                  │ │ exercises        │   │
│ No relations   │                  │ │ sets             │   │
│ No queries     │                  │ │ gates            │   │
│                │                  │ └──────────────────┘   │
│                │                  │                        │
│                │                  │ + Auth (email/Google)  │
│                │                  │ + Row Level Security   │
│                │                  │ + Realtime updates     │
│                │                  │ + SQL queries          │
└────────────────┘                  └────────────────────────┘
```

### Project 4: Workout Video Analysis (Cloud AI)
**Skills**: cloud inference, multimodal AI, async processing

Record workout clips and analyze with a vision model:
- Capture short video clips during sets (MediaRecorder API)
- Upload to cloud storage (Supabase Storage or S3)
- Send to Gemini or Claude Vision for form analysis
- Compare cloud analysis with your on-device landmark data

### Project 5: Custom Exercise Detection Model
**Skills**: data collection, model training, TFLite, edge deployment

```
┌─────────────────────────────────────────────────────────┐
│  Custom Model Training Pipeline                          │
│                                                          │
│  1. COLLECT          2. LABEL           3. TRAIN         │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐    │
│  │ Record   │       │ Tag each │       │ Train    │    │
│  │ landmark │──────▶│ sequence │──────▶│ small    │    │
│  │ sequences│       │          │       │ model    │    │
│  │ during   │       │ "pushup" │       │          │    │
│  │ workouts │       │ "squat"  │       │ TF.js or │    │
│  │          │       │ "plank"  │       │ Python   │    │
│  │ (you have│       │ "rest"   │       │          │    │
│  │  this!)  │       │          │       │          │    │
│  └──────────┘       └──────────┘       └────┬─────┘    │
│                                              │          │
│  4. EXPORT           5. DEPLOY               │          │
│  ┌──────────┐       ┌──────────┐             │          │
│  │ Convert  │       │ Load in  │◀────────────┘          │
│  │ to TFLite│──────▶│ browser  │                        │
│  │ (.tflite)│       │ alongside│                        │
│  │          │       │ Pose     │                        │
│  │          │       │ Landmark │                        │
│  │          │       │ er       │                        │
│  └──────────┘       └──────────┘                        │
│                                                          │
│  Result: Auto-detect which exercise the user is doing    │
│  without them having to select it!                       │
└─────────────────────────────────────────────────────────┘
```

---

## Part 6: Recommended Learning Order

```
YOU ARE HERE
     │
     ▼
┌──────────────────────────────────────────────────────┐
│  Phase 1: Backend Foundations (2-4 weeks)             │
│  ┌────────────────────────────────────────────────┐  │
│  │ ✦ Add Supabase (auth + database)              │  │
│  │ ✦ Migrate Netlify Blobs → PostgreSQL          │  │
│  │ ✦ Learn SQL through your own data model       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Phase 2: LLM Integration (2-4 weeks)                │
│  ┌────────────────────────────────────────────────┐  │
│  │ ✦ Get Claude API key, first API call          │  │
│  │ ✦ Add Vercel AI SDK, streaming chat           │  │
│  │ ✦ Connect to workout data for AI coaching     │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Phase 3: AI Product Patterns (4-8 weeks)            │
│  ┌────────────────────────────────────────────────┐  │
│  │ ✦ Implement tool use (LLM calls your APIs)    │  │
│  │ ✦ Build RAG over exercise knowledge base      │  │
│  │ ✦ Add evaluation: measure AI coach quality    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Phase 4: Advanced ML (ongoing)                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ✦ Deep dive into PoseLandmarker internals     │  │
│  │ ✦ Custom model training (form classifier)     │  │
│  │ ✦ Multimodal AI (video analysis)              │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
              AI PRODUCT ENGINEER
```

---

## Key Mindset Shifts

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   FRONT-END THINKING     │        │   AI PRODUCT THINKING    │
│                          │        │                          │
│  Deterministic           │        │  Probabilistic           │
│  same input = same       │   ──▶  │  same input = similar    │
│  output ALWAYS           │        │  but different output    │
│                          │        │                          │
│  Test with assertions    │   ──▶  │  Test with evaluations   │
│  expect(x).toBe(y)      │        │  score(output) > 0.8     │
│                          │        │                          │
│  Debug with console.log  │   ──▶  │  Debug with prompt       │
│                          │        │  iteration and tracing   │
│                          │        │                          │
│  Ship pixel-perfect UI   │   ──▶  │  Ship "good enough"      │
│                          │        │  with guardrails         │
│                          │        │                          │
│  Optimize bundle size    │   ──▶  │  Optimize token usage    │
│                          │        │  and latency             │
│                          │        │                          │
│  User sees exactly       │   ──▶  │  User sees what the      │
│  what you built          │        │  model generates         │
└──────────────────────────┘        └──────────────────────────┘
```

The biggest advantage you have: **you already build products**. Most ML engineers can train models but struggle to ship user-facing products. You're coming from the product side and adding AI capabilities — that's exactly what the industry needs.
