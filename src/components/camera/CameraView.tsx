'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Landmark } from '@/lib/pose/landmarks'
import { PoseDetector } from '@/lib/pose/mediapipe'
import { SkeletonOverlay } from './SkeletonOverlay'
import { cn } from '@/lib/utils'
import './camera-view.css'

interface CameraViewProps {
  /** Called on each frame with detected pose landmarks. */
  onLandmarks: (landmarks: Landmark[]) => void
  children?: React.ReactNode
}

type CameraState = 'loading' | 'ready' | 'denied' | 'error'

export function CameraView({ onLandmarks, children }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onLandmarksRef = useRef(onLandmarks)
  onLandmarksRef.current = onLandmarks

  const [cameraState, setCameraState] = useState<CameraState>('loading')
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [dimensions, setDimensions] = useState({ width: 480, height: 640 })
  const [confidence, setConfidence] = useState(0)

  const handleLandmarks = useCallback((lms: Landmark[]) => {
    setLandmarks(lms)
    onLandmarksRef.current(lms)

    // Calculate average visibility for confidence indicator
    if (lms.length > 0) {
      const avg = lms.reduce((sum, lm) => sum + lm.visibility, 0) / lms.length
      setConfidence(avg)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await video.play()

        // Get actual video dimensions
        const vw = video.videoWidth || 640
        const vh = video.videoHeight || 480
        setDimensions({ width: vw, height: vh })

        // Initialize pose detector
        const detector = await PoseDetector.create({
          onResults: handleLandmarks,
          onError: (err) => console.warn('[CameraView] pose error:', err),
        })

        if (cancelled) {
          detector.destroy()
          return
        }

        detectorRef.current = detector
        detector.start(video)
        setCameraState('ready')
      } catch (err) {
        if (cancelled) return
        const error = err as Error
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraState('denied')
        } else {
          setCameraState('error')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      detectorRef.current?.destroy()
      detectorRef.current = null
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [handleLandmarks])

  // Update container dimensions on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (cameraState === 'denied') {
    return (
      <div className="camera-view">
        <div className="camera-view__error">
          <p className="camera-view__error-title">Camera Access Denied</p>
          <p className="camera-view__error-msg">
            Camera access is needed for automatic rep counting.
            Please enable camera permissions in your browser settings.
          </p>
        </div>
      </div>
    )
  }

  if (cameraState === 'error') {
    return (
      <div className="camera-view">
        <div className="camera-view__error">
          <p className="camera-view__error-title">Camera Error</p>
          <p className="camera-view__error-msg">
            Could not access camera or load pose detection model.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="camera-view">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-view__video"
      />

      {cameraState === 'loading' && (
        <div className="camera-view__loading">
          <p>Starting camera...</p>
          <p>Loading pose detection model</p>
        </div>
      )}

      {cameraState === 'ready' && landmarks.length > 0 && (
        <SkeletonOverlay
          landmarks={landmarks}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {cameraState === 'ready' && (
        <span className={cn(
          'camera-view__confidence',
          confidence > 0.6 ? 'camera-view__confidence--good' : 'camera-view__confidence--low'
        )}>
          {Math.round(confidence * 100)}%
        </span>
      )}

      {children}
    </div>
  )
}
