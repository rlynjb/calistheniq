# CalisthenIQ - AI-Powered Calisthenics Coach

CalisthenIQ is an AI-powered calisthenics coach focused on helping beginners build strength safely through proper form, controlled progressions, and body awareness.

## Philosophy

Instead of generic workouts, CalisthenIQ uses an **agent-based approach** to guide users step-by-step—adapting exercises, cues, and difficulty based on:
- **Movement quality** - Form comes first, always
- **User feedback** - Your input shapes your progression
- **Consistency** - Sustainable strength over intense bursts

The goal is not intensity, but **sustainable strength built on solid fundamentals**.

## Features

✅ **Adaptive Coaching Agent** - AI coach that learns from your feedback and adjusts your program
✅ **Exercise Library** - Comprehensive beginner exercises with progressions and regressions  
✅ **Form-First Approach** - Detailed form cues and common mistakes for each exercise
✅ **Progressive Difficulty** - Automatic progression/regression suggestions based on performance
✅ **Progress Tracking** - Track your workouts, exercise history, and improvements
✅ **Interactive CLI** - User-friendly command-line interface for guided workouts

## Installation

### From source:

```bash
# Clone the repository
git clone https://github.com/rlynjb/calistheniq.git
cd calistheniq

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

## Quick Start

After installation, run:

```bash
calistheniq
```

This launches the interactive CLI where you can:
1. **Start a workout** - Get a guided workout session with real-time coaching
2. **Get exercise form guidance** - Learn proper form for any exercise
3. **View progress** - See your workout history and improvements
4. **Setup profile** - Customize your goals and preferences

## How It Works

### Agent-Based Coaching

CalisthenIQ uses an intelligent coaching agent that:

1. **Assesses** your performance after each exercise
2. **Analyzes** form quality, difficulty, and completion rate
3. **Adapts** by suggesting progressions, regressions, or volume adjustments
4. **Guides** with personalized feedback and encouragement

### Sample Workout Flow

```
1. Warm-up (guided)
2. Exercise 1: Wall Push-ups
   - See form cues
   - Perform sets
   - Provide feedback (reps, difficulty, form quality)
   - Receive coaching advice
3. Exercise 2: Bodyweight Squats
   - (same flow)
4. Cool-down (guided)
5. View session summary
```

### Adaptive Intelligence

The coach adapts based on your feedback:

- **Form is poor** → Focus on technique, provide key form cues
- **Too easy** → Suggest harder variation or increase volume
- **Too hard** → Suggest easier variation or reduce volume  
- **Just right** → Maintain current level, build consistency

## Exercise Library

Currently includes beginner-friendly exercises:

**Upper Body:**
- Wall Push-ups
- Incline Push-ups
- Knee Push-ups
- Dead Hang

**Core:**
- Plank

**Lower Body:**
- Bodyweight Squats
- Glute Bridge

Each exercise includes:
- Detailed description
- Key form cues
- Common mistakes to avoid
- Progression/regression options
- Recommended sets, reps, and rest

## Development

### Project Structure

```
calistheniq/
├── calistheniq/
│   ├── __init__.py
│   ├── agent.py         # Coaching agent logic
│   ├── exercises.py     # Exercise library and definitions
│   └── cli.py          # Command-line interface
├── setup.py
├── requirements.txt
└── README.md
```

### Running from source

```bash
python -m calistheniq.cli
```

## Future Enhancements

- [ ] Web interface
- [ ] Video demonstrations
- [ ] More advanced exercises
- [ ] Workout programs (e.g., 30-day challenges)
- [ ] Integration with fitness trackers
- [ ] Social features (share progress, challenges)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Philosophy & Approach

CalisthenIQ is built on the principle that **quality movement beats quantity every time**. We don't push you to failure or promote "no pain, no gain" mentality. Instead:

- **Start where you are** - Honest assessment of current ability
- **Progress gradually** - Small, sustainable improvements
- **Master fundamentals** - Build a strong foundation
- **Listen to your body** - Pain is a signal, not a badge
- **Stay consistent** - Regular practice beats sporadic intensity

Perfect for beginners who want to build real, lasting strength without injury or burnout.