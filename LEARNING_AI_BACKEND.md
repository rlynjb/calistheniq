# Learning Path: Front-End Developer to AI Product Engineer

A practical guide anchored in what you've already built with CalisthenIQ. Each section connects industry concepts to hands-on code you can touch in this repo.

---

## Part 1: Backend Fundamentals (Language-Agnostic)

### What You Already Know (From This App)

You're already using serverless functions (`netlify/functions/`), blob storage, and REST endpoints. That's a backend. The concepts below formalize what you're doing intuitively.

### Core Concepts

**Request-Response Cycle**
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
- SQL (PostgreSQL, MySQL): structured tables, relationships, ACID transactions. Best for structured data like your user levels, sessions, exercise definitions
- NoSQL (MongoDB, DynamoDB): flexible documents. Similar to your Netlify Blob JSON storage
- *In your app*: Netlify Blobs store JSON documents — conceptually a key-value/document store
- *Upgrade path*: Supabase (PostgreSQL + auth + realtime) or PlanetScale (MySQL) for production

**Authentication & Authorization**
- Authentication = who are you? (login)
- Authorization = what can you do? (permissions)
- JWT (JSON Web Tokens): stateless auth tokens. Most common for APIs
- OAuth 2.0: "Sign in with Google/GitHub". Delegates auth to a provider
- *In your app*: no auth yet — adding Supabase Auth or Clerk would be a strong backend exercise

**Server Architecture Patterns**
- Monolith: single deployable unit. Simple, good starting point
- Serverless functions: what you use now (`netlify/functions/`). Pay-per-invocation, auto-scaling
- Microservices: separate services per domain (user service, workout service). Overkill for most apps
- Edge functions: run at CDN edge, close to user. Netlify Edge Functions, Vercel Edge Runtime
- *Key insight*: serverless is already a production architecture pattern, not a toy

**Caching, Queues, Background Jobs**
- Cache: store computed results to avoid re-computation (Redis, CDN cache, browser cache)
- Message queues: decouple producers from consumers (SQS, RabbitMQ). Example: "process workout video" job
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
- Larger models = more accurate but slower
- Quantization: reduce precision (float32 → int8) for speed. MediaPipe uses this
- Distillation: train a small model to mimic a large one
- *In your app*: MediaPipe's "lite" model trades some accuracy for real-time performance on mobile

### How Your Rep Counting Connects

Your pose processors (`src/lib/pose/exercises/pushup.ts`) are a textbook example of **signal processing on ML output**:

```
Raw video frames
  → ML model (PoseLandmarker) → 33 landmarks with x,y,z,visibility
  → Feature extraction (joint angles)
  → State machine (idle → down → bottom → up → count)
  → Business logic (rep completed, target reached)
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
Video frame (HTMLVideoElement)
  → Image preprocessing (resize, normalize pixel values)
  → Person detection (find bounding box of human)
  → Pose estimation (predict 33 keypoint locations within bounding box)
  → Post-processing (smooth landmarks across frames, calculate visibility)
  → Output: Landmark[] with normalized x, y, z, visibility
```

### Delegates: How Inference Runs

- **CPU delegate**: pure JavaScript/WASM. Works everywhere, slowest
- **GPU delegate (WebGL)**: uses GPU shaders for matrix math. 2-5x faster
- **WASM SIMD**: uses CPU vector instructions. Good middle ground
- *In your app*: `PoseDetector.create()` in `src/lib/pose/mediapipe.ts` loads the WASM runtime

### Model Variants
- **Lite**: smallest, fastest, least accurate. Good for real-time mobile
- **Full**: balanced accuracy and speed
- **Heavy**: most accurate, slower. Good for offline processing
- *Your choice matters*: on mobile, lite model at 15-30fps vs heavy model at 5-10fps

### On-Device vs Cloud Inference

| Aspect | On-Device (Your App) | Cloud API |
|--------|---------------------|-----------|
| Latency | ~30ms per frame | 100-500ms network round trip |
| Privacy | Video never leaves device | Video sent to server |
| Cost | Free (user's CPU/GPU) | Pay per API call |
| Model size | Limited by download size | Unlimited |
| Offline | Works offline | Requires internet |
| Accuracy | Constrained by device | Best available models |

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
User asks: "How do I improve my pushup form?"
  → Search your exercise database for pushup-related content
  → Retrieve user's recent pushup session data
  → Include both as context in the LLM prompt
  → LLM generates personalized advice
```

**Components**:
- Vector database (Pinecone, Weaviate, pgvector): stores text as embeddings for semantic search
- Embedding model: converts text to vectors (OpenAI `text-embedding-3-small`)
- Retriever: finds relevant documents given a query
- Generator: LLM that produces the final answer

### Tool Use / Function Calling

LLMs can call functions you define. The model decides when and how to call them.

```typescript
// You define available tools
const tools = [{
  name: "get_user_workout_history",
  description: "Get the user's recent workout sessions",
  parameters: { days: { type: "number" } }
}]

// Model decides to call it
// Response: { tool_call: "get_user_workout_history", args: { days: 7 } }

// You execute the function and return results to the model
```

*In your app*: imagine an AI coach that can call `getUserData()`, analyze workout patterns, and give personalized advice using your existing API layer.

### Agent Architectures

Agents are LLMs that can take actions in a loop:
```
Observe → Think → Act → Observe → Think → Act → ... → Done
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

Unlike traditional testing, AI outputs are non-deterministic:
- **Assertion-based**: check structure (is it valid JSON? does it have required fields?)
- **LLM-as-judge**: use another LLM to evaluate quality
- **Human evaluation**: gold standard but expensive
- **Regression testing**: save good outputs, compare future runs
- **A/B testing**: compare model versions on real user traffic

### MLOps Basics

The lifecycle of ML in production:
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

Add an AI coach endpoint that analyzes workout history and gives advice:
- Create a Next.js API route that calls Claude API
- Pass user's session history as context
- Stream the response to a chat UI
- Use structured output for actionable suggestions

```
"You completed 8/10 pushups across 3 sets. Your consistency is improving —
last week you averaged 6. Focus on controlled descent for the remaining 2 reps."
```

### Project 2: Exercise Form Scoring (On-Device ML + LLM)
**Skills**: feature engineering, custom ML pipeline, prompt engineering

Use your existing landmark data to score exercise form:
- Extract joint angles per frame from landmarks (you already compute these)
- Define "ideal" angle ranges for each exercise phase
- Score deviation from ideal as a percentage
- Use an LLM to generate natural language feedback from the scores

### Project 3: Supabase Backend Migration
**Skills**: SQL, auth, real-time, row-level security

Replace Netlify Blobs with Supabase:
- Design a relational schema (users, sessions, exercises, sets)
- Add Supabase Auth (email + social login)
- Use Row Level Security for per-user data isolation
- Add real-time subscriptions for live workout updates

### Project 4: Workout Video Analysis (Cloud AI)
**Skills**: cloud inference, multimodal AI, async processing

Record workout clips and analyze with a vision model:
- Capture short video clips during sets (MediaRecorder API)
- Upload to cloud storage (Supabase Storage or S3)
- Send to Gemini or Claude Vision for form analysis
- Compare cloud analysis with your on-device landmark data

### Project 5: Custom Exercise Detection Model
**Skills**: data collection, model training, TFLite, edge deployment

Train a model to classify exercise type from landmarks:
- Collect landmark data during workouts (you already have this pipeline)
- Label sequences (pushup, squat, plank, rest)
- Train a small classifier (TensorFlow.js or Python → TFLite)
- Deploy alongside PoseLandmarker for automatic exercise detection

---

## Part 6: Recommended Learning Order

### Phase 1: Backend Foundations (2-4 weeks)
1. Add Supabase to this app (auth + database)
2. Migrate from Netlify Blobs to PostgreSQL tables
3. Learn SQL basics through your own data model

### Phase 2: LLM Integration (2-4 weeks)
1. Get Claude API key, make first API call from a Next.js route
2. Add Vercel AI SDK, build a streaming chat component
3. Connect it to your workout data for personalized coaching

### Phase 3: AI Product Patterns (4-8 weeks)
1. Implement tool use (LLM calls your existing API functions)
2. Build a RAG system over exercise knowledge base
3. Add evaluation: measure if AI coach advice is helpful

### Phase 4: Advanced ML (ongoing)
1. Deep dive into how PoseLandmarker works internally
2. Experiment with custom model training (form quality classifier)
3. Explore multimodal AI (video analysis with Gemini/Claude Vision)

---

## Key Mindset Shifts

| Front-End Thinking | AI Product Thinking |
|---|---|
| Deterministic: same input → same output | Probabilistic: same input → similar but different output |
| Test with assertions | Test with evaluations and statistical measures |
| Debug with console.log | Debug with prompt iteration and tracing |
| Ship pixel-perfect UI | Ship "good enough" with guardrails and fallbacks |
| Optimize bundle size | Optimize token usage and latency |
| User sees exactly what you built | User sees what the model generates |

The biggest advantage you have: **you already build products**. Most ML engineers can train models but struggle to ship user-facing products. You're coming from the product side and adding AI capabilities — that's exactly what the industry needs.
