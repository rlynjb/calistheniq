export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">CalisthenIQ Coach</h1>
          <p className="text-muted-foreground">Your AI-powered calisthenics coach</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {/* Welcome Message */}
            <div className="coaching-bubble">
              <p>
                Welcome to CalisthenIQ! I'm your AI coach, ready to help you build strength safely. 
                Let's start with a quick intake to understand your goals, available time, equipment, and any constraints.
              </p>
              <p className="mt-2">
                What's your fitness goal, and how much time do you have for today's workout?
              </p>
            </div>
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="border-t p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tell me about your fitness goals and available time..."
                className="flex-1 px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Example: "I'm a beginner looking to build upper body strength. I have 20 minutes and just bodyweight equipment."
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
