'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Category, Exercise } from '@/types'
import type { Landmark } from '@/lib/pose/landmarks'
import { createPushupProcessor } from '@/lib/pose/exercises/pushup'
import { createSquatProcessor } from '@/lib/pose/exercises/squat'
import { createPlankProcessor } from '@/lib/pose/exercises/plank'
import { CameraView } from '@/components/camera/CameraView'
import { SetCameraHUD } from './SetCameraHUD'

interface SetCameraOverlayProps {
  category: Category
  exercise: Exercise
  setIndex: number
  targetValue: number
  onComplete: (value: number) => void
  onClose: () => void
}

export function SetCameraOverlay({
  category,
  exercise,
  setIndex,
  targetValue,
  onComplete,
  onClose,
}: SetCameraOverlayProps) {
  const [repCount, setRepCount] = useState(0)
  const [holdTimeMs, setHoldTimeMs] = useState(0)
  const [targetReached, setTargetReached] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const lastFrameTimeRef = useRef(0)

  // Create processor once on mount
  const processorRef = useRef(
    exercise.isHold
      ? { type: 'plank' as const, processor: createPlankProcessor() }
      : category === 'squat'
        ? { type: 'rep' as const, processor: createSquatProcessor() }
        : { type: 'rep' as const, processor: createPushupProcessor() }
  )

  // Portal needs client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Countdown timer — starts when user taps Start
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const timer = setTimeout(() => setCountdown(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleStart = useCallback(() => {
    setCountdown(10)
  }, [])

  const handleLandmarks = useCallback((landmarks: Landmark[]) => {
    if (countdown === null || countdown > 0) return

    const { type, processor } = processorRef.current
    const now = performance.now()

    if (type === 'plank') {
      if (targetReached) return
      const deltaMs = lastFrameTimeRef.current > 0 ? now - lastFrameTimeRef.current : 0
      lastFrameTimeRef.current = now

      const result = processor.processFrame(landmarks, deltaMs)
      setHoldTimeMs(result.holdTimeMs)
      setIsHolding(result.isHolding)
      if (Math.round(result.holdTimeMs / 1000) >= targetValue) {
        setTargetReached(true)
      }
    } else {
      if (targetReached) return
      const result = processor.processFrame(landmarks)
      if (result.repCompleted) {
        setRepCount(prev => {
          const next = prev + 1
          if (next >= targetValue) setTargetReached(true)
          return next
        })
      }
    }
  }, [targetValue, targetReached, countdown])

  const handleDone = useCallback(() => {
    if (exercise.isHold) {
      onComplete(Math.round(holdTimeMs / 1000))
    } else {
      onComplete(repCount)
    }
  }, [exercise.isHold, holdTimeMs, repCount, onComplete])

  if (!mounted) return null

  const overlay = (
    <div className="set-camera-overlay">
      <div className="set-camera-overlay__camera">
        <CameraView onLandmarks={handleLandmarks}>
          <SetCameraHUD
            exerciseName={exercise.name}
            setLabel={`Set ${setIndex + 1} / ${exercise.targetSets}`}
            isHold={exercise.isHold}
            repCount={repCount}
            holdTimeMs={holdTimeMs}
            targetValue={targetValue}
            targetReached={targetReached}
            isHolding={isHolding}
            countdown={countdown}
            onStart={handleStart}
            onDone={handleDone}
            onCancel={onClose}
          />
        </CameraView>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
