'use client'

import { useRef, useEffect } from 'react'
import type { Landmark } from '@/lib/pose/landmarks'
import { SKELETON_CONNECTIONS } from '@/lib/pose/landmarks'

interface SkeletonOverlayProps {
  landmarks: Landmark[]
  width: number
  height: number
}

const LANDMARK_RADIUS = 4
const LINE_WIDTH = 2
const GOOD_VISIBILITY = 0.6

export function SkeletonOverlay({ landmarks, width, height }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !landmarks.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

    // Draw connections
    for (const [from, to] of SKELETON_CONNECTIONS) {
      const a = landmarks[from]
      const b = landmarks[to]
      if (!a || !b) continue

      const visible = a.visibility > GOOD_VISIBILITY && b.visibility > GOOD_VISIBILITY
      ctx.beginPath()
      ctx.moveTo(a.x * width, a.y * height)
      ctx.lineTo(b.x * width, b.y * height)
      ctx.strokeStyle = visible ? 'rgba(0, 229, 255, 0.7)' : 'rgba(107, 138, 171, 0.3)'
      ctx.lineWidth = LINE_WIDTH
      ctx.stroke()
    }

    // Draw landmarks
    for (const lm of landmarks) {
      const visible = lm.visibility > GOOD_VISIBILITY
      ctx.beginPath()
      ctx.arc(lm.x * width, lm.y * height, LANDMARK_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = visible ? '#00e5ff' : 'rgba(107, 138, 171, 0.4)'
      ctx.fill()
    }
  }, [landmarks, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="camera-view__canvas"
      style={{ width, height }}
    />
  )
}
