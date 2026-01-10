"""Tests for the coaching agent."""

from calistheniq.agent import (
    CoachingAgent,
    UserProfile,
    UserFeedback,
    FormQuality
)
from calistheniq.exercises import DifficultyLevel


def test_user_profile_creation():
    """Test creating a user profile."""
    profile = UserProfile(name="Test User")
    
    assert profile.name == "Test User"
    assert profile.experience_level == DifficultyLevel.BEGINNER
    assert profile.completed_workouts == 0
    assert len(profile.exercise_history) == 0


def test_add_feedback():
    """Test adding feedback to user profile."""
    profile = UserProfile(name="Test User")
    
    feedback = UserFeedback(
        exercise_id="wall_pushup",
        difficulty_rating=3,
        form_quality=FormQuality.GOOD,
        completed_reps=10,
        target_reps=12
    )
    
    profile.add_feedback(feedback)
    
    assert "wall_pushup" in profile.exercise_history
    assert len(profile.exercise_history["wall_pushup"]) == 1


def test_coaching_agent_creation():
    """Test creating a coaching agent."""
    profile = UserProfile(name="Test User")
    coach = CoachingAgent(profile)
    
    assert coach.user == profile
    assert coach.exercise_library is not None


def test_assess_and_adapt_good_form():
    """Test coaching assessment with good form."""
    profile = UserProfile(name="Test User")
    coach = CoachingAgent(profile)
    
    feedback = UserFeedback(
        exercise_id="wall_pushup",
        difficulty_rating=3,
        form_quality=FormQuality.GOOD,
        completed_reps=12,
        target_reps=12
    )
    
    advice = coach.assess_and_adapt(feedback)
    
    assert "assessment" in advice
    assert "next_action" in advice
    assert "encouragement" in advice
    assert advice["next_action"] == "maintain_current"


def test_assess_and_adapt_too_easy():
    """Test coaching assessment when exercise is too easy."""
    profile = UserProfile(name="Test User")
    coach = CoachingAgent(profile)
    
    feedback = UserFeedback(
        exercise_id="wall_pushup",
        difficulty_rating=1,  # Too easy
        form_quality=FormQuality.EXCELLENT,
        completed_reps=15,
        target_reps=12
    )
    
    advice = coach.assess_and_adapt(feedback)
    
    assert advice["next_action"] in ["suggest_progression", "increase_volume"]
    assert "progression_advice" in advice


def test_assess_and_adapt_poor_form():
    """Test coaching assessment with poor form."""
    profile = UserProfile(name="Test User")
    coach = CoachingAgent(profile)
    
    feedback = UserFeedback(
        exercise_id="wall_pushup",
        difficulty_rating=3,
        form_quality=FormQuality.POOR,
        completed_reps=8,
        target_reps=12
    )
    
    advice = coach.assess_and_adapt(feedback)
    
    assert advice["next_action"] == "focus_on_form"
    assert len(advice["form_feedback"]) > 0


def test_generate_workout():
    """Test workout generation."""
    profile = UserProfile(name="Test User")
    coach = CoachingAgent(profile)
    
    workout = coach.generate_workout()
    
    assert "name" in workout
    assert "exercises" in workout
    assert "warm_up" in workout
    assert "cool_down" in workout
    assert len(workout["exercises"]) > 0
    assert len(workout["warm_up"]) > 0


def test_provide_form_guidance():
    """Test form guidance provision."""
    profile = UserProfile(name="Test User")
    coach = CoachingAgent(profile)
    
    guidance = coach.provide_form_guidance("wall_pushup")
    
    assert "exercise" in guidance
    assert "key_points" in guidance
    assert "common_mistakes" in guidance
    assert len(guidance["key_points"]) > 0


if __name__ == "__main__":
    test_user_profile_creation()
    test_add_feedback()
    test_coaching_agent_creation()
    test_assess_and_adapt_good_form()
    test_assess_and_adapt_too_easy()
    test_assess_and_adapt_poor_form()
    test_generate_workout()
    test_provide_form_guidance()
    print("✓ All agent tests passed!")
