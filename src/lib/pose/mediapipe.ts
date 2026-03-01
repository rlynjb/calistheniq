/**
 * MediaPipe PoseLandmarker wrapper.
 * Manages model loading, video processing loop, and cleanup.
 */
import {
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision'
import type { Landmark } from './landmarks'

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_CDN = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

export interface PoseDetectorCallbacks {
  /** Called with pose landmarks on each processed frame. */
  onResults: (landmarks: Landmark[]) => void
  /** Called when an error occurs during detection. */
  onError?: (error: Error) => void
}

/**
 * Wraps MediaPipe PoseLandmarker with a requestAnimationFrame loop
 * for continuous video pose detection.
 */
export class PoseDetector {
  private landmarker: PoseLandmarker | null = null
  private callbacks: PoseDetectorCallbacks
  private animFrameId: number | null = null
  private running = false

  private constructor(callbacks: PoseDetectorCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Create and initialize a PoseDetector.
   * Loads the WASM runtime and pose model from CDN.
   */
  static async create(callbacks: PoseDetectorCallbacks): Promise<PoseDetector> {
    const detector = new PoseDetector(callbacks)

    const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
    detector.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_CDN,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    return detector
  }

  /** Start processing frames from a video element. */
  start(video: HTMLVideoElement): void {
    if (this.running) return
    this.running = true

    let lastTime = -1

    const processFrame = () => {
      if (!this.running || !this.landmarker) return

      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime
        try {
          const result = this.landmarker.detectForVideo(video, performance.now())
          if (result.landmarks && result.landmarks.length > 0) {
            // Map MediaPipe landmarks to our Landmark type
            const pose: Landmark[] = result.landmarks[0].map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility ?? 0,
            }))
            this.callbacks.onResults(pose)
          }
        } catch (err) {
          this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
        }
      }

      this.animFrameId = requestAnimationFrame(processFrame)
    }

    this.animFrameId = requestAnimationFrame(processFrame)
  }

  /** Stop the processing loop. */
  stop(): void {
    this.running = false
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  /** Stop processing and release the model. */
  destroy(): void {
    this.stop()
    this.landmarker?.close()
    this.landmarker = null
  }
}
