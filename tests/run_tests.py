"""Run all tests."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests import test_exercises, test_agent

def run_all_tests():
    """Run all test modules."""
    print("Running CalisthenIQ Tests...\n")
    
    print("=" * 60)
    print("Testing Exercise Library...")
    print("=" * 60)
    test_exercises.test_exercise_creation()
    test_exercises.test_exercise_library_beginner()
    test_exercises.test_exercise_library_get_exercise()
    test_exercises.test_exercise_progressions()
    print("✓ All exercise tests passed!\n")
    
    print("=" * 60)
    print("Testing Coaching Agent...")
    print("=" * 60)
    test_agent.test_user_profile_creation()
    test_agent.test_add_feedback()
    test_agent.test_coaching_agent_creation()
    test_agent.test_assess_and_adapt_good_form()
    test_agent.test_assess_and_adapt_too_easy()
    test_agent.test_assess_and_adapt_poor_form()
    test_agent.test_generate_workout()
    test_agent.test_provide_form_guidance()
    print("✓ All agent tests passed!\n")
    
    print("=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
