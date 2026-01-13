import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-6">🤸‍♂️</div>
        <h1 className="text-4xl font-bold mb-4">
          Welcome to CalisthenIQ
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your AI-powered calisthenics coach focused on helping beginners build strength safely 
          through proper form, controlled progressions, and body awareness.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat">
            <Button size="lg" className="px-8">
              Start Coaching Session
            </Button>
          </Link>
          <Link href="/workout">
            <Button variant="outline" size="lg" className="px-8">
              View Sample Workout
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧠 AI-Powered Coaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Multi-agent AI system with specialized coaches for intake, program design, 
              technique guidance, and gamification.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛡️ Safety First
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Conservative approach with injury prevention, proper form emphasis, 
              and respect for individual limitations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Progressive Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Structured progressions that build strength gradually while developing 
              movement quality and body awareness.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-semibold mb-2">Intake & Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Share your goals, experience level, available time, and any limitations
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-semibold mb-2">Custom Program</h3>
            <p className="text-sm text-muted-foreground">
              AI creates a personalized workout plan based on your profile
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-semibold mb-2">Guided Training</h3>
            <p className="text-sm text-muted-foreground">
              Real-time coaching cues and form guidance during your workout
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
              4
            </div>
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Earn XP, maintain streaks, and celebrate achievements
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <Card className="text-center">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h3>
          <p className="text-muted-foreground mb-6">
            Begin with a conversation with your AI coach to create your first personalized workout.
          </p>
          <Link href="/chat">
            <Button size="lg">
              Talk to Your Coach
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
