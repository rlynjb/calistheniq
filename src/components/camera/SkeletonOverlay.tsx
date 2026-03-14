'use client'

import { useRef, useEffect } from 'react'
import type { Landmark } from '@/lib/pose/landmarks'
import { SKELETON_CONNECTIONS } from '@/lib/pose/landmarks'

interface SkeletonOverlayProps {
  landmarks: Landmark[]
  containerWidth: number
  containerHeight: number
  videoWidth: number
  videoHeight: number
}

const LANDMARK_RADIUS = 4
const LINE_WIDTH = 2
const GOOD_VISIBILITY = 0.6

/**
 * Compute the offset and scale that object-cover applies
 * to fit the video into the container.
 */
function getObjectCoverTransform(
  containerW: number, containerH: number,
  videoW: number, videoH: number,
) {
  const containerAR = containerW / containerH
  const videoAR = videoW / videoH

  let scale: number
  let offsetX = 0
  let offsetY = 0

  if (videoAR > containerAR) {
    // Video is wider than container — height matches, sides cropped
    scale = containerH / videoH
    const displayedW = videoW * scale
    offsetX = (displayedW - containerW) / 2
  } else {
    // Video is taller than container — width matches, top/bottom cropped
    scale = containerW / videoW
    const displayedH = videoH * scale
    offsetY = (displayedH - containerH) / 2
  }

  return { scale, offsetX, offsetY }
}

export function SkeletonOverlay({
  landmarks, containerWidth, containerHeight, videoWidth, videoHeight,
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !landmarks.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = containerWidth
    canvas.height = containerHeight
    ctx.clearRect(0, 0, containerWidth, containerHeight)

    const { scale, offsetX, offsetY } = getObjectCoverTransform(
      containerWidth, containerHeight, videoWidth, videoHeight,
    )

    // Convert normalized landmark coord to container pixel coord
    const toX = (nx: number) => nx * videoWidth * scale - offsetX
    const toY = (ny: number) => ny * videoHeight * scale - offsetY

    // Draw connections
    for (const [from, to] of SKELETON_CONNECTIONS) {
      const a = landmarks[from]
      const b = landmarks[to]
      if (!a || !b) continue

      const visible = a.visibility > GOOD_VISIBILITY && b.visibility > GOOD_VISIBILITY
      ctx.beginPath()
      ctx.moveTo(toX(a.x), toY(a.y))
      ctx.lineTo(toX(b.x), toY(b.y))
      ctx.strokeStyle = visible ? 'rgba(0, 229, 255, 0.7)' : 'rgba(107, 138, 171, 0.3)'
      ctx.lineWidth = LINE_WIDTH
      ctx.stroke()
    }

    // Draw landmarks
    for (const lm of landmarks) {
      const visible = lm.visibility > GOOD_VISIBILITY
      ctx.beginPath()
      ctx.arc(toX(lm.x), toY(lm.y), LANDMARK_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = visible ? '#00e5ff' : 'rgba(107, 138, 171, 0.4)'
      ctx.fill()
    }
  }, [landmarks, containerWidth, containerHeight, videoWidth, videoHeight])

  return (
    <canvas
      ref={canvasRef}
      className="camera-view__canvas"
      style={{ width: containerWidth, height: containerHeight }}
    />
  )
}
