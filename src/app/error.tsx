'use client'

import './error.css'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-page">
      <p className="error-page__message">Something went wrong</p>
      <button
        onClick={reset}
        className="error-page__retry"
      >
        Try again
      </button>
    </div>
  )
}
