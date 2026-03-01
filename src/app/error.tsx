'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-sm font-mono">
      <p className="text-tron-muted">Something went wrong</p>
      <button
        onClick={reset}
        className="rounded-lg border border-tron-primary/30 bg-tron-primary-dim px-4 py-2 text-tron-primary transition-colors hover:bg-tron-primary/20"
      >
        Try again
      </button>
    </div>
  )
}
