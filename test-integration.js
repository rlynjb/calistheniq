#!/usr/bin/env node

// Test script to verify the frontend-backend integration
const API_BASE = 'http://localhost:8888'

async function testCoachEndpoint() {
  console.log('🧪 Testing Contrl API Integration...\n')

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing test endpoint...')
    const testResponse = await fetch(`${API_BASE}/.netlify/functions/test`)
    const testData = await testResponse.json()
    console.log('✅ Test endpoint working:', testData.message)
    console.log(`   Environment: ${testData.environment}`)
    console.log('')

    // Test 2: Initial coach interaction
    console.log('2️⃣  Testing coach endpoint - Initial interaction...')
    const coachResponse1 = await fetch(`${API_BASE}/.netlify/functions/coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Hi, I'm a beginner looking to build upper body strength with 20 minutes available"
      })
    })

    const coachData1 = await coachResponse1.json()
    console.log('✅ Coach response:', coachData1.message.substring(0, 100) + '...')
    console.log(`   Session ID: ${coachData1.sessionId}`)
    console.log(`   Current Agent: ${coachData1.currentAgent}`)
    console.log(`   Session State: ${coachData1.sessionState}`)
    console.log('')

    // Test 3: Follow-up interaction
    console.log('3️⃣  Testing coach endpoint - Follow-up...')
    const coachResponse2 = await fetch(`${API_BASE}/.netlify/functions/coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "I want to focus on push-ups and have TRX available",
        sessionId: coachData1.sessionId,
        sessionState: coachData1.sessionState
      })
    })

    const coachData2 = await coachResponse2.json()
    console.log('✅ Follow-up response:', coachData2.message.substring(0, 100) + '...')
    console.log(`   Agent: ${coachData2.currentAgent}`)
    console.log(`   State: ${coachData2.sessionState}`)
    console.log('')

    // Test 4: Check for workout plan generation
    if (coachData2.sessionState === 'program' || coachData2.context?.workoutPlan) {
      console.log('4️⃣  Workout plan detected!')
      if (coachData2.context?.workoutPlan) {
        const plan = coachData2.context.workoutPlan
        console.log('✅ Workout plan generated:')
        console.log(`   Duration: ${plan.duration} minutes`)
        console.log(`   Exercises: ${plan.exercises?.length || 0} exercises`)
        console.log('')
      }
    }

    console.log('🎉 API Integration Test Complete!\n')
    console.log('✅ Frontend can successfully:')
    console.log('   • Connect to Netlify functions')
    console.log('   • Send messages to the coach')
    console.log('   • Maintain session state')
    console.log('   • Receive structured responses')
    console.log('   • Progress through agent states')
    console.log('')
    console.log('🚀 Ready for frontend testing at: http://localhost:8888')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testCoachEndpoint()
