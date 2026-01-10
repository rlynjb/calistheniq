"""
Demo script showing CalisthenIQ functionality without user interaction.
"""

from calistheniq.agent import CoachingAgent, UserProfile, UserFeedback, FormQuality
from calistheniq.exercises import ExerciseLibrary


def demo_coaching_session():
    """Demonstrate the coaching agent in action."""
    
    print("="*70)
    print("  CalisthenIQ Demo - AI-Powered Calisthenics Coach")
    print("="*70)
    print()
    
    # Create a user profile
    print("Creating user profile...")
    user = UserProfile(
        name="Demo User",
        goals=["Build upper body strength", "Improve core stability"]
    )
    print(f"✓ Profile created for {user.name}")
    print(f"  Goals: {', '.join(user.goals)}")
    print()
    
    # Create coaching agent
    print("Initializing AI Coach...")
    coach = CoachingAgent(user)
    print("✓ Coach ready!")
    print()
    
    # Generate a workout
    print("-"*70)
    print("Generating personalized workout...")
    print("-"*70)
    workout = coach.generate_workout()
    
    print(f"\n📋 {workout['name']}")
    print(f"Focus: {workout['focus']}\n")
    
    print("🔥 Warm-up:")
    for item in workout['warm_up'][:3]:
        print(f"  • {item}")
    print()
    
    print("💪 Main Workout:")
    for i, exercise in enumerate(workout['exercises'][:3], 1):
        print(f"\n  {i}. {exercise['name']}")
        print(f"     {exercise['sets']} sets × {exercise['reps']} reps")
        print(f"     Key form cue: {exercise['form_cues'][0]}")
    print()
    
    # Demonstrate form guidance
    print("-"*70)
    print("Getting form guidance for Wall Push-up...")
    print("-"*70)
    guidance = coach.provide_form_guidance("wall_pushup")
    print(f"\n📖 {guidance['exercise']}")
    print(f"   {guidance['description']}\n")
    print("Key Points:")
    for i, point in enumerate(guidance['key_points'][:3], 1):
        print(f"  {i}. {point}")
    print(f"\n💡 {guidance['focus_tip']}")
    print()
    
    # Simulate exercise feedback scenarios
    print("-"*70)
    print("Simulating exercise feedback and coaching...")
    print("-"*70)
    
    # Scenario 1: Good performance, just right difficulty
    print("\n--- Scenario 1: Good Form, Appropriate Difficulty ---")
    feedback1 = UserFeedback(
        exercise_id="wall_pushup",
        difficulty_rating=3,  # Just right
        form_quality=FormQuality.GOOD,
        completed_reps=12,
        target_reps=12
    )
    print(f"User completed: {feedback1.completed_reps}/{feedback1.target_reps} reps")
    print(f"Difficulty: {feedback1.difficulty_rating}/5, Form: {feedback1.form_quality.value}")
    
    advice1 = coach.assess_and_adapt(feedback1)
    print(f"\n🤖 Coach Assessment: {advice1['assessment']}")
    print(f"💬 {advice1['encouragement']}")
    
    # Scenario 2: Too easy - ready for progression
    print("\n--- Scenario 2: Exercise Too Easy, Perfect Form ---")
    feedback2 = UserFeedback(
        exercise_id="wall_pushup",
        difficulty_rating=1,  # Too easy
        form_quality=FormQuality.EXCELLENT,
        completed_reps=15,
        target_reps=12
    )
    print(f"User completed: {feedback2.completed_reps}/{feedback2.target_reps} reps")
    print(f"Difficulty: {feedback2.difficulty_rating}/5, Form: {feedback2.form_quality.value}")
    
    advice2 = coach.assess_and_adapt(feedback2)
    print(f"\n🤖 Coach Assessment: {advice2['assessment']}")
    print(f"📈 {advice2['progression_advice']}")
    print(f"💬 {advice2['encouragement']}")
    
    # Scenario 3: Poor form - focus on technique
    print("\n--- Scenario 3: Poor Form - Need Technique Work ---")
    feedback3 = UserFeedback(
        exercise_id="bodyweight_squat",
        difficulty_rating=4,  # Hard
        form_quality=FormQuality.POOR,
        completed_reps=8,
        target_reps=12
    )
    print(f"User completed: {feedback3.completed_reps}/{feedback3.target_reps} reps")
    print(f"Difficulty: {feedback3.difficulty_rating}/5, Form: {feedback3.form_quality.value}")
    
    advice3 = coach.assess_and_adapt(feedback3)
    print(f"\n🤖 Coach Assessment: {advice3['assessment']}")
    print(f"📝 Form focus points:")
    for cue in advice3['form_feedback'][:2]:
        print(f"  • {cue}")
    print(f"💬 {advice3['encouragement']}")
    
    # Show progress
    print("\n" + "-"*70)
    print("User Progress Summary")
    print("-"*70)
    print(f"Exercises tracked: {len(user.exercise_history)}")
    for ex_id, feedbacks in user.exercise_history.items():
        ex = ExerciseLibrary.get_exercise(ex_id)
        print(f"\n  {ex.name}:")
        print(f"    Sessions: {len(feedbacks)}")
        if feedbacks:
            latest = feedbacks[-1]
            print(f"    Latest: {latest.completed_reps} reps, form: {latest.form_quality.value}")
    
    print("\n" + "="*70)
    print("  Demo Complete!")
    print("  Run 'calistheniq' to start your interactive coaching session")
    print("="*70)


if __name__ == "__main__":
    demo_coaching_session()
