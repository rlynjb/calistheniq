# Netlify Functions Configuration - Implementation Guide

**Status**: 🔄 **FRAMEWORK COMPLETE** (Needs AI & Database Integration)  
**Phase**: Week 3-4 - Core Orchestration (75% Complete)  
**Date**: January 11, 2026

## Overview

This document outlines the **orchestration framework** implementation for Cali- **Frontend Integration**: Uses `/.netlify/functions/coach` endpoint

- **Session Persistence**: Session management handled by SessionManager abstraction
- **Error Handling**: Graceful fallbacks for function failures

### Database Integration (Pending)

- SessionManager interface designed for seamless database integration
- **Current**: In-memory storage with automatic cleanup
- **Needs**: Replace SessionManager's internal storage with Postgres/Neon connection
- **Needs**: Persistent session, user profile, and workout data storage
- **Ready**: All session operations already async and database-readymulti-agent architecture. The serverless functions provide the backend structure and routing logic, but still need integration with OpenAI Agents SDK and database persistence.

**Current State**: Infrastructure and routing logic complete, but agents are placeholders returning mock responses.

---

## 🏗️ Architecture Overview

### Core Structure

```
netlify/
└── functions/
    ├── coach.ts                    # Main orchestrator endpoint
    ├── test.ts                     # Function testing endpoint
    └── core/
        └── orchestration/
            ├── state-machine.ts    # Session state management
            ├── supervisor.ts       # Multi-agent routing logic
            ├── session-manager.ts  # Session persistence
            └── response-handler.ts # Response formatting
```

### Request Flow

```
Frontend → coach.ts → ResponseHandler → Supervisor → SessionManager → State Machine → Agent Router → ResponseHandler → Frontend
```

**Key Architecture Changes**:

- **ResponseHandler Integration**: Both coach.ts and supervisor.ts use ResponseHandler for consistent formatting
- **Enhanced Processing**: Processing time tracking, message enrichment, and content sanitization
- **SessionManager Integration**: All session operations flow through SessionManager abstraction
- **Clean Separation**: Each component has clear responsibilities with proper abstractions

---

## 📋 Implementation Details

### 1. Main Coach Function (`/coach.ts`)

**Purpose**: Primary API endpoint for all chat interactions

**Technical Pattern**: **API Gateway / Backend for Frontend (BFF)**

- **Pattern Type**: Single entry point for external requests with internal service orchestration
- **Role**: Acts as facade between external HTTP clients and internal domain services
- **Responsibilities**: Request validation, protocol translation, response aggregation, cross-cutting concerns
- **Architecture Position**: `External Client → [API Gateway: coach.ts] → Internal Services (supervisor) → Business Logic`

**Key Characteristics**:

- **Single Entry Point**: All external requests funnel through this endpoint
- **Request Orchestration**: Transforms HTTP requests into domain objects (`SupervisorRequest`)
- **Response Aggregation**: Enhances internal responses (`SupervisorResponse`) with metadata and formatting
- **Cross-Cutting Concerns**: CORS, validation, error handling, logging, processing time tracking
- **Protocol Translation**: HTTP ↔ Domain object conversion

**Key Features**:

- ✅ TypeScript integration with `@netlify/functions`
- ✅ CORS handling for frontend communication
- ✅ Request validation and error handling
- ✅ Integration with supervisor orchestration
- ✅ **ResponseHandler integration** for consistent formatting
- ✅ **Processing time tracking** and enhanced metadata
- ✅ **Message enrichment** with contextual information
- ✅ **Content sanitization** for security
- 🔄 **Ready for**: OpenAI Agents SDK integration

**API Contract**:

```typescript
// Request (unchanged)
interface CoachRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  sessionState?: "intake" | "planning" | "workout" | "logging" | "complete";
}

// Response (Enhanced with ResponseHandler)
interface FormattedResponse {
  message: string;
  sessionId: string;
  sessionState: SessionState;
  currentAgent: AgentType;
  data?: any;
  context?: SessionContext;
  metadata: {
    timestamp: string;
    processing_time_ms: number;
    agent: AgentType;
    state_transition?: {
      from: SessionState;
      to: SessionState;
    };
  };
}
```

**Endpoints**:

- `POST /.netlify/functions/coach` - Main chat interaction
- `OPTIONS /.netlify/functions/coach` - CORS preflight

### 2. State Machine (`/core/orchestration/state-machine.ts`)

**Purpose**: Manages session states and determines agent routing

**Technical Pattern**: **Finite State Machine (FSM) + Context Pattern**

- **Pattern Type**: Computational model with finite states, deterministic transitions, and context preservation
- **FSM Implementation**: Defines workflow progression through distinct fitness coaching phases
- **Context Pattern**: Maintains session state and accumulated data throughout the workflow
- **State Validation**: Explicit transition guards prevent invalid state changes

**State Diagram**:

```
intake → planning → workout → logging → complete
   ↑         ↑                              ↓
   └─────────┴──────────────────────────────┘
                    (startNew)
```

**Session States & Workflow**:

- `intake` → Intake & Safety Agent (User onboarding and safety assessment)
- `planning` → Program Designer Agent (Personalized workout creation)
- `workout` → Technique Coach Agent (Exercise execution with coaching)
- `logging` → Gamification Agent (Performance tracking and gamification)
- `complete` → Session end state (Session wrap-up and continuation options)

**FSM Characteristics**:

- **Finite States**: Fixed set of 5 workflow phases
- **Deterministic Transitions**: Rule-based state progression via `getNextState()`
- **Transition Guards**: Validation via `isValidTransition()` prevents invalid moves
- **State-to-Action Mapping**: Each state maps to specific agent via `getAgentForState()`
- **Context Preservation**: `SessionContext` maintains workflow state and accumulated data
- **Immutable Updates**: `updateContext()` creates new context instances

**Key Classes**:

- `StateMachine` - Core FSM logic and transition rules
- `SessionContext` - Context pattern implementation for state preservation
- State transition validation and business rule enforcement
- Agent mapping logic based on current state

**Features**:

- ✅ **Deterministic state transitions** with business rule validation
- ✅ **Session context tracking** with immutable updates
- ✅ **Metadata management** (timestamps, step counts, audit trail)
- ✅ **State validation and error handling** via transition guards
- ✅ **Workflow modeling** of complete fitness coaching process
- 🔄 **Ready for**: Agent integration with predictable state management

### 3. Supervisor (`/core/orchestration/supervisor.ts`)

**Purpose**: Main orchestrator that routes requests to appropriate agents

**Technical Pattern**: **Orchestrator Pattern + Strategy Pattern**

- **Primary Pattern**: Orchestrator/Process Manager - Centralized coordinator for complex business processes
- **Supporting Pattern**: Strategy Pattern - Runtime agent selection based on session state
- **Process Management**: Manages multi-step workflows with state persistence and error recovery
- **Service Coordination**: Orchestrates StateMachine, SessionManager, ResponseHandler, and multiple agents

**Orchestrator Process Flow**:

```
1. Receive Request → 2. Load/Create Session Context → 3. Validate State Transitions
4. Determine Current Agent (via StateMachine) → 5. Route to Agent (Strategy Pattern)
6. Process Agent Response → 7. Calculate Next State → 8. Update Context & Persist
9. Format Response (via ResponseHandler) → 10. Return Coordinated Response
```

**Key Responsibilities**:

- **Centralized Process Coordination**: Single point of control for fitness coaching workflow
- **State Management & Persistence**: Maintains workflow state across multiple interactions
- **Multi-Service Coordination**: Orchestrates interactions between StateMachine, SessionManager, ResponseHandler
- **Process Flow Control**: Controls workflow progression based on business rules and agent responses
- **Error Handling & Compensation**: Centralized error handling with structured recovery logic

**Strategy Pattern Implementation**:

```typescript
// Context: The Supervisor
// Strategy Interface: Agent handlers (handleIntakeAgent, handleProgramAgent, etc.)
// Concrete Strategies: Different agent implementations
// Runtime Selection: Agent chosen based on current session state
private async routeToAgent(agent: AgentType, message: string, context: SessionContext)
```

**Architectural Improvements**:

- ✅ **Removed Direct Session Storage**: No longer maintains internal session Map
- ✅ **Delegates to SessionManager**: All session operations go through SessionManager abstraction
- ✅ **ResponseHandler Integration**: Consistent error handling and message formatting
- ✅ **Enhanced Mock Agents**: Professional, context-aware responses without debug prefixes
- ✅ **Message Sanitization**: All agent responses sanitized for security
- ✅ **Clean Separation of Concerns**: Orchestration logic separate from session management
- ✅ **Process Isolation**: Each workflow instance is independent with consistent state management
- ✅ **Service Decoupling**: Agents don't know about each other or the workflow
- ✅ **Comprehensive Error Recovery**: Centralized error handling and compensation logic

**Features**:

- ✅ **Multi-agent routing logic** with runtime strategy selection
- ✅ **Session context coordination** via SessionManager with state consistency
- ✅ **Professional agent responses** with coaching tone and context awareness
- ✅ **Consistent error formatting** via ResponseHandler with structured recovery
- ✅ **Message enhancement and sanitization** for security and user experience
- ✅ **Process state management** with audit trails and observability
- 🔄 **Placeholder agents**: Enhanced but not connected to OpenAI yet

**Agent Handlers** (Enhanced Mock Responses):

- `handleIntakeAgent()` - **Welcome flow with progressive questioning** (Strategy: User Onboarding)
- `handleProgramAgent()` - **Personalized workout planning with time options** (Strategy: Workout Design)
- `handleTechniqueAgent()` - **Context-aware coaching with form feedback** (Strategy: Exercise Coaching)
- `handleGamificationAgent()` - **Engaging XP/streak system with achievements** (Strategy: Motivation & Progress)

**Orchestration Benefits**:

- **Process Isolation**: Each workflow instance maintains independent state
- **Extensibility**: Easy to add new agents or modify workflow without breaking existing logic
- **Observability**: Single point for monitoring entire fitness coaching process
- **Transaction Boundaries**: Consistent state updates with rollback capabilities

### 4. Session Manager (`/core/orchestration/session-manager.ts`)

**Purpose**: Centralized session persistence and lifecycle management abstraction

**Technical Pattern**: **Repository Pattern + Data Access Object (DAO) + Singleton**

- **Repository Pattern**: Encapsulates session storage logic with a domain-oriented interface
- **DAO Pattern**: Provides abstract interface for database operations (CRUD + lifecycle management)
- **Singleton Pattern**: Single instance manages all session operations across the application
- **Data Access Abstraction**: Clean separation between business logic and data persistence layer

**Repository Characteristics**:

- **Domain-Oriented Interface**: Methods like `saveSession()`, `getUserSessions()` reflect business operations
- **Storage Abstraction**: Hides implementation details (currently in-memory Map, future database)
- **Query Methods**: Supports both single session retrieval and user-based queries
- **Lifecycle Management**: Handles creation, persistence, expiration, and cleanup

**DAO Implementation**:

```typescript
// CRUD Operations
async saveSession(sessionId: string, context: SessionContext): Promise<void>
async getSession(sessionId: string): Promise<SessionContext | null>
async deleteSession(sessionId: string): Promise<void>

// Bulk Operations
async getUserSessions(userId: string): Promise<SessionContext[]>
exportSessions(): Record<string, SessionContext>
importSessions(sessions: Record<string, SessionContext>): void

// Lifecycle Management
async cleanupExpiredSessions(maxAgeHours: number): Promise<void>
getSessionStats(): { totalSessions, activeStates, averageStepCount }
```

**Architectural Improvements**:

- ✅ **Centralized Session Logic**: All session-related operations in one place via Repository pattern
- ✅ **Session ID Generation**: Handles creation of unique session identifiers
- ✅ **Storage Abstraction**: DAO pattern hides storage implementation from business logic
- ✅ **Public Cleanup Method**: Exposed manual cleanup alongside automatic cleanup
- ✅ **Consistent API**: Unified interface for all session operations
- ✅ **Database-Ready**: Abstraction layer ready for seamless database integration
- ✅ **Lifecycle Management**: Complete session lifecycle from creation to expiration
- ✅ **Backup/Migration**: Export/import capabilities for data management

**Features**:

- ✅ **In-memory session storage** (temporary MVP solution via Repository abstraction)
- ✅ **Session CRUD operations** with async DAO interface
- ✅ **User session querying** with business-oriented methods
- ✅ **Automatic cleanup of expired sessions** (via internal timer and lifecycle management)
- ✅ **Manual cleanup trigger** (`cleanupExpiredSessions()`)
- ✅ **Session ID generation** with collision avoidance
- ✅ **Session statistics and monitoring** for operational insights
- ✅ **Data export/import** for backup and migration scenarios
- 🔄 **Needs**: Database integration (simple storage layer swap due to abstraction)

**Core Methods** (Repository Interface):

- `generateSessionId()` - Create unique session identifier with timestamp and randomness
- `saveSession(sessionId, context)` - Persist session context with immutable copy
- `getSession(sessionId)` - Retrieve session by ID (returns null if not found)
- `deleteSession(sessionId)` - Remove session with confirmation logging
- `getUserSessions(userId)` - Query all sessions for specific user
- `getSessionStats()` - Aggregate statistics for monitoring and analytics
- `cleanupExpiredSessions(maxAgeHours)` - Manual cleanup trigger with age threshold
- `exportSessions()` / `importSessions()` - Backup and migration operations

**Repository Benefits**:

- **Storage Independence**: Business logic doesn't depend on storage implementation
- **Easy Testing**: Repository interface can be mocked for unit tests
- **Database Migration**: Swap storage implementation without changing business logic
- **Query Flexibility**: Support for various query patterns (by ID, by user, by criteria)
- **Transaction Support**: Ready for database transaction boundaries
- **Caching Layer**: Can be enhanced with caching without interface changes

### 5. Response Handler (`/core/orchestration/response-handler.ts`)

**Purpose**: Centralized response formatting and message enhancement

**Integration Status**: ✅ **FULLY INTEGRATED** - Now actively used by both coach.ts and supervisor.ts

**Technical Pattern**: **Data Normalization Layer**

- **Pattern Type**: Response normalization and standardization
- **Input**: Heterogeneous data from diverse agent sources (intake, program, coach, gamification)
- **Process**: Converts varied agent outputs into consistent, standardized format
- **Output**: Uniform `FormattedResponse` structure with enriched metadata
- **Benefits**: Eliminates response variance, ensures API contract consistency, enables frontend predictability

**Architecture Role**:

```
Raw Agent Data → [ResponseHandler Normalization] → Standardized Response Format
```

**Features**:

- ✅ **Active Response Formatting**: All responses formatted with metadata and timestamps
- ✅ **Processing Time Tracking**: Measures and reports request processing duration
- ✅ **Message Enhancement**: Context-aware message enrichment (step counts, XP, progress)
- ✅ **Content Sanitization**: Security filtering of all response messages
- ✅ **Consistent Error Handling**: Standardized error response formatting
- ✅ **State Transition Tracking**: Records session state changes in metadata
- 🔄 **Streaming structure**: Ready for OpenAI SDK integration

**Core Methods** (Now Active):

- `formatResponse()` - **Used by coach.ts** for final response formatting
- `formatErrorResponse()` - **Used by both coach.ts and supervisor.ts** for error handling
- `sanitizeMessage()` - **Used by supervisor.ts** for all agent responses
- `enrichMessageWithContext()` - **Used by coach.ts** for contextual message enhancement
- `createStreamingChunks()` - Ready for streaming implementation
- `generateDebugInfo()` - Available for development debugging

**Response Enhancement Examples**:

```typescript
// Before ResponseHandler Integration
{
  "message": "Thanks for your message. What are your main fitness goals?",
  "sessionId": "session_123"
}

// After ResponseHandler Integration
{
  "message": "Thanks for your message. What are your main fitness goals?\n\n*Building your profile (step 2)*",
  "sessionId": "session_123",
  "sessionState": "intake",
  "currentAgent": "intake",
  "metadata": {
    "timestamp": "2026-01-12T10:30:00.000Z",
    "processing_time_ms": 150,
    "agent": "intake",
    "state_transition": { "from": "intake", "to": "intake" }
  }
}
```

### 6. Test Function (`/test.ts`)

**Purpose**: Verification endpoint for Netlify Functions setup

**Features**:

- ✅ Configuration verification
- ✅ Environment information
- ✅ Function health check
- ✅ CORS testing

**Endpoint**: `GET/POST /.netlify/functions/test`

---

## 🔧 Configuration Files

### netlify.toml

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Package.json Scripts

```json
{
  "scripts": {
    "netlify-dev": "netlify dev",
    "netlify-build": "netlify build"
  },
  "dependencies": {
    "@netlify/functions": "^2.4.0"
  },
  "devDependencies": {
    "netlify-cli": "^17.0.0"
  }
}
```

---

## 🧪 Testing & Verification

### Local Development

```bash
# Start Netlify development server
npm run netlify-dev

# Functions available at:
# http://localhost:8888/.netlify/functions/coach
# http://localhost:8888/.netlify/functions/test
```

### Test Endpoints

**1. Health Check**:

```bash
curl http://localhost:8888/.netlify/functions/test
```

**2. Coach Function**:

```bash
curl -X POST http://localhost:8888/.netlify/functions/coach \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I want to start working out"}'
```

**Expected Response**: Mock response from placeholder agents

**3. Frontend Integration**:

- Functions accessible via `/api/*` redirect
- CORS enabled for frontend communication
- Session management working with temporary storage

---

## 🔗 Integration Points

### Frontend Integration

- **Constants**: API endpoints defined in `src/lib/constants.ts`
- **Chat Interface**: Uses `/.netlify/functions/coach` endpoint
- **Session Persistence**: Session IDs maintained (in-memory only)
- **Error Handling**: Graceful fallbacks for function failures

### Database Integration (Pending)

- Session Manager interface designed for database integration
- **Needs**: Postgres/Neon connection implementation
- **Needs**: Persistent session storage
- **Needs**: User profile and workout data persistence

### OpenAI Agents SDK Integration (Pending)

- Agent handlers are placeholder functions
- **Needs**: Replace mock responses with OpenAI Agents SDK
- **Needs**: Function calling tools implementation
- **Needs**: Real streaming response handling

---

## 🚀 Deployment Status

### Local Development

- ✅ Functions running on `http://localhost:8888`
- ✅ Hot reload working
- ✅ TypeScript compilation successful
- ✅ CORS configured for frontend
- ✅ **ResponseHandler integration active** - Enhanced responses with metadata
- ✅ **Professional mock agents** - Realistic coaching experience
- 🔄 **Returns**: Enhanced mock responses with professional coaching tone (not debug responses)

### Production Readiness

- ✅ Environment variables configured
- ✅ Build scripts ready
- ✅ Error handling implemented
- ✅ Security headers configured
- 🔄 **Needs**: Real agent integration before production deploy

---

## 📈 Performance Considerations

### Current Implementation

- **Cold Start**: ~200-500ms (typical for serverless)
- **Memory Usage**: Minimal (SessionManager handles in-memory sessions efficiently)
- **Concurrent Sessions**: Limited by Netlify function concurrency
- **Session Cleanup**: Automatic hourly cleanup + manual cleanup via SessionManager
- **Session Operations**: All async, ready for database integration

### Optimization Opportunities

- **Database Integration**: Replace SessionManager's in-memory storage with persistent storage
- **Connection Pooling**: For database connections when integrated
- **Caching**: Response caching for static data
- **Streaming**: Real-time response streaming with OpenAI

---

## 🔮 Next Steps

### Week 3-4: Core Orchestration (90% Complete)

- ✅ Supervisor/router implementation - **Architecture Refined + ResponseHandler Integrated**
- ✅ State machine logic - **Framework Complete**
- ✅ Session management - **Abstraction Complete, Ready for Database**
- ✅ **ResponseHandler integration** - **Fully Active in coach.ts and supervisor.ts**
- ✅ **Enhanced mock agents** - **Professional responses with coaching tone**
- ✅ **Message processing pipeline** - **Sanitization, enrichment, formatting**
- ✅ Clean separation of concerns - **All components properly decoupled**
- 🔄 Response streaming - **Structure Ready, Needs OpenAI SDK**

### Immediate Priorities (Week 5-6)

1. **Database Schema**: Integrate Postgres/Neon with SessionManager (minimal changes needed)
2. **OpenAI Agents SDK**: Replace placeholder agent handlers with real AI agents
3. **Function Calling Tools**: Implement `save_profile`, `create_session`, `log_set` tools
4. **Real Agent Implementation**: Build the 4 specialized agents with proper prompts
5. **Streaming Integration**: Connect OpenAI SDK streaming to response handler

---

## 🐛 Known Issues & Limitations

### Current Limitations

- **In-Memory Storage**: SessionManager uses in-memory storage (ready for database swap)
- **Mock Agents**: Enhanced responses but not connected to OpenAI Agents SDK yet
- **No Database**: SessionManager abstraction ready, needs database implementation
- **No Function Tools**: Database operation tools not implemented yet
- **No Streaming**: Response structure ready but no real streaming implementation
- **No Authentication**: User identification via sessionId only (MVP acceptable)

### Planned Resolutions (Week 5-6)

- **Database integration**: Simple SessionManager storage swap to Postgres/Neon
- **OpenAI Agents SDK integration**: Replace enhanced mock agents with real AI agents
- **Function calling tools**: Implement database operation tools
- **Real streaming responses**: Connect OpenAI SDK streaming to existing ResponseHandler
- **Authentication system**: User management (post-MVP)

**Current State Benefits**:

- **Professional User Experience**: Enhanced mock agents provide realistic coaching preview
- **Complete Response Pipeline**: Message processing, enhancement, and formatting fully active
- **Consistent Error Handling**: All error scenarios properly formatted and handled
- **Ready for AI Integration**: ResponseHandler seamlessly works with any response source

---

## 🏷️ Tags

`netlify-functions` `serverless` `orchestration` `multi-agent` `typescript` `mvp` `backend`

---

**Implementation Notes**:

- All functions use proper TypeScript typing and error handling
- CORS configured for frontend integration
- **ResponseHandler fully integrated** for consistent response formatting and enhancement
- **Professional mock agents** provide realistic coaching experience preview
- **Message processing pipeline** active: sanitization → enrichment → formatting → delivery
- Session management framework ready for database persistence
- **Enhanced error handling** with structured responses and detailed context
- Code structure designed for easy OpenAI Agents SDK integration
- **Current State**: Complete response pipeline active, enhanced user experience, ready for AI integration

This completes the **enhanced orchestration framework** phase of the CalisthenIQ MVP development roadmap. The system now provides a professional coaching experience with placeholder agents while the infrastructure is fully ready for OpenAI Agents SDK integration.
