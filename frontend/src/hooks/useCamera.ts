/**
 * hooks/useCamera.ts
 *
 * Manages the full WebRTC camera lifecycle:
 *   • Requests getUserMedia permissions
 *   • Attaches stream to a <video> ref
 *   • Captures a frame as a base-64 JPEG data URL
 *   • Supports front / back camera toggle
 *   • Cleans up stream tracks on unmount
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type FacingMode = 'user' | 'environment';

export interface CameraState {
  /** Attach this ref to the <video> element */
  videoRef:      React.RefObject<HTMLVideoElement | null>;
  /** True while camera stream is active */
  isStreaming:   boolean;
  /** True while waiting for getUserMedia to resolve */
  isLoading:     boolean;
  /** Set when permission is denied or device not found */
  error:         string | null;
  /** Current facing mode */
  facingMode:    FacingMode;
  /** Start (or restart) the camera with the current facingMode */
  startCamera:   () => Promise<void>;
  /** Stop all tracks and release the camera */
  stopCamera:    () => void;
  /** Toggle between front and rear cameras */
  switchCamera:  () => void;
  /**
   * Capture the current video frame.
   * @returns base-64 JPEG data URL, or null if video isn't ready.
   */
  captureFrame:  (quality?: number) => string | null;
}

export function useCamera(defaultFacing: FacingMode = 'environment'): CameraState {
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [facingMode,  setFacingMode]  = useState<FacingMode>(defaultFacing);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    // Stop any existing stream before requesting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    setIsLoading(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata so dimensions are known before we call play()
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => resolve();
        });
        await videoRef.current.play();
      }

      setIsStreaming(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // ── Toggle facing mode ─────────────────────────────────────────────────────
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Re-start when facingMode changes (only if already streaming)
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Capture frame ──────────────────────────────────────────────────────────
  const captureFrame = useCallback((quality = 0.92): string | null => {
    const video = videoRef.current;
    if (!video || !isStreaming || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', quality);
  }, [isStreaming]);

  return {
    videoRef,
    isStreaming,
    isLoading,
    error,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
  };
}
