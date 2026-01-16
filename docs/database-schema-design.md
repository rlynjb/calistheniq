# Database Schema Design for CalisthenIQ

Based on the current data structures in `src/data/*` and `src/types/*`.

## Database Design Requirements Analysis

### Current Data Structures:

1. **Exercise Data** (`WorkoutLevels/mock.ts`):

   - 70+ exercises with metadata
   - Level progression (0-5: Foundation → Expert)
   - Categories (Push, Pull, Squat)
   - Sets, reps, tempo, rest, equipment, notes
   - Metadata: id, difficulty, tags

2. **User Progress** (`CurrentLevel/mock.ts`):

   - Current levels per category
   - Movement category tracking

3. **Workout Sessions** (`WeeklyProgress/mock.ts`):
   - Historical and planned workouts
   - Exercise combinations
   - Duration, categories, completion status

## Proposed Database Schema

```sql
-- ========================================
-- CORE TABLES
-- ========================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- EXERCISE LIBRARY TABLES
-- ========================================

-- Workout levels (Foundation, Beginner, Novice, etc.)
CREATE TABLE workout_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,          -- "Foundation", "Beginner", etc.
  description TEXT,                   -- Level description
  level_order INTEGER NOT NULL,       -- 0, 1, 2, 3, 4, 5
  UNIQUE(level_order)
);

-- Exercise categories
CREATE TABLE exercise_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,          -- "Push", "Pull", "Squat"
  description TEXT
);

-- Master exercises table - your main exercise library
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  level_id INTEGER REFERENCES workout_levels(id),
  category_id INTEGER REFERENCES exercise_categories(id),

  -- Default exercise configuration
  default_sets JSONB NOT NULL,        -- [{"reps": 8}, {"reps": 6}, {"duration": 30}]
  default_tempo VARCHAR(20),           -- "3-2-3-1", "hold"
  default_rest_seconds INTEGER,       -- 90, 120
  default_equipment TEXT,             -- "Mini band", "Pull-up bar"
  default_notes TEXT,                 -- Exercise instructions/tips

  -- Exercise metadata
  difficulty VARCHAR(20),             -- "Foundation", "Beginner", etc.
  tags TEXT[],                        -- ["wall", "band", "assisted"]

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- USER PROGRESS TABLES
-- ========================================

-- User's current level in each category
CREATE TABLE user_current_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES exercise_categories(id),
  current_level INTEGER NOT NULL,     -- 0, 1, 2, etc.

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, category_id)
);

-- User's personalized exercise configurations
-- This allows users to have custom sets/reps different from defaults
CREATE TABLE user_exercise_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,

  -- User's current working parameters (progressing toward defaults)
  current_sets JSONB,                 -- User's current working sets
  current_tempo VARCHAR(20),          -- User's current tempo
  current_rest_seconds INTEGER,       -- User's current rest
  current_notes TEXT,                 -- User's personal notes

  -- Progress tracking
  is_mastered BOOLEAN DEFAULT FALSE,  -- Has user mastered default parameters?
  mastered_at TIMESTAMP,              -- When they achieved the default

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, exercise_id)
);

-- ========================================
-- WORKOUT SESSION TABLES
-- ========================================

-- Workout sessions (both completed and planned)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  session_type VARCHAR(20) NOT NULL,  -- "completed", "planned", "today"
  session_date DATE NOT NULL,         -- When workout was/will be done
  scheduled_time TIME,                -- Planned time for workout

  duration_minutes INTEGER,           -- Actual or estimated duration
  level_id INTEGER REFERENCES workout_levels(id), -- Difficulty level

  -- Status and completion
  status VARCHAR(20) DEFAULT 'planned', -- "planned", "in_progress", "completed", "skipped"
  completed_at TIMESTAMP,

  notes TEXT,                         -- Session notes

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual exercises within a workout session
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),

  exercise_order INTEGER NOT NULL,    -- Order within the session

  -- Planned parameters (copied from user config or defaults)
  planned_sets JSONB NOT NULL,       -- What was planned
  planned_tempo VARCHAR(20),
  planned_rest_seconds INTEGER,
  planned_notes TEXT,

  -- Actual performance (for completed workouts)
  actual_sets JSONB,                 -- What was actually done
  actual_tempo VARCHAR(20),
  actual_rest_seconds INTEGER,
  actual_notes TEXT,

  completed BOOLEAN DEFAULT FALSE,    -- Was this exercise completed?

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual set logging for detailed tracking
CREATE TABLE exercise_set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE CASCADE,

  set_number INTEGER NOT NULL,        -- 1, 2, 3, etc.

  -- Planned vs actual
  planned_reps INTEGER,
  actual_reps INTEGER,
  planned_duration_seconds INTEGER,
  actual_duration_seconds INTEGER,

  -- Set-specific data
  weight_kg DECIMAL(5,2),            -- For weighted exercises (future)
  rest_seconds INTEGER,              -- Actual rest taken after this set
  perceived_effort INTEGER,          -- 1-10 RPE scale
  notes TEXT,                        -- Set-specific notes

  completed_at TIMESTAMP,            -- When this set was finished

  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- WEEKLY PROGRESS TRACKING
-- ========================================

-- Daily workout summary for weekly view
CREATE TABLE daily_workout_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,

  -- Summary metrics
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  categories TEXT[],                  -- ["Push", "Pull"]

  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  is_today BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, workout_date)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User lookup indexes
CREATE INDEX idx_user_current_levels_user_id ON user_current_levels(user_id);
CREATE INDEX idx_user_exercise_configs_user_id ON user_exercise_configs(user_id);
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_daily_workout_summary_user_id ON daily_workout_summary(user_id);

-- Exercise lookup indexes
CREATE INDEX idx_exercises_level_category ON exercises(level_id, category_id);
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);

-- Session lookup indexes
CREATE INDEX idx_workout_sessions_date_status ON workout_sessions(session_date, status);
CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);

-- Weekly progress indexes
CREATE INDEX idx_daily_workout_summary_date ON daily_workout_summary(workout_date);
CREATE INDEX idx_daily_workout_summary_user_date ON daily_workout_summary(user_id, workout_date);
```

## Data Migration from Current Mock Data

### 1. Populate Core Data:

```sql
-- Insert workout levels
INSERT INTO workout_levels (name, description, level_order) VALUES
('Foundation', 'Stability, control, and knee-friendly movements', 0),
('Beginner', 'Basic bodyweight movements', 1),
('Novice', 'Intermediate progressions', 2),
('Intermediate', 'Standard calisthenics exercises', 3),
('Advanced', 'High-level skills and strength', 4),
('Expert', 'Elite calisthenics mastery', 5);

-- Insert categories
INSERT INTO exercise_categories (name, description) VALUES
('Push', 'Pushing movements - chest, shoulders, triceps'),
('Pull', 'Pulling movements - back, biceps'),
('Squat', 'Lower body movements - legs, glutes');
```

### 2. Migrate Exercise Data:

- Convert `allExercises` array from `WorkoutLevels/mock.ts`
- Map level names to level IDs
- Convert sets arrays to JSONB format
- Preserve all metadata (tags, equipment, etc.)

### 3. User Progress Migration:

- Convert `mockCurrentUserLevels` to `user_current_levels` table
- Create default user for testing

## Key Features Supported:

### ✅ Database Capabilities:

1. **Master Exercise Library**: `exercises` table with all defaults
2. **Workout Session Management**: `workout_sessions` + `session_exercises` tables
3. **Progress Tracking**: Update sets, reps, tempo, rest, notes via `session_exercises` and `exercise_set_logs`
4. **User Progression**: `user_exercise_configs` for current vs default tracking

### ✅ Additional Capabilities:

- Detailed set-by-set logging
- Progress tracking toward exercise mastery
- Weekly summary views
- Flexible exercise configurations per user
- Historical workout analysis
- Future workout planning

### ✅ Architecture Benefits:

- Normalized design eliminates data duplication
- Flexible JSONB for variable set configurations
- Scalable for multiple users
- Supports both planned and completed workouts
- Detailed performance analytics
- Easy migration from current mock data

## Next Steps:

1. Set up PostgreSQL/Neon database
2. Run schema creation scripts
3. Create data migration scripts from current mock data
4. Update data layer to use database instead of mock files
5. Implement database connection and query layers
