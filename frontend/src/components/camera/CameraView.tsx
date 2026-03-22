/**
 * components/camera/CameraView.tsx
 *
 * Renders the live WebRTC video stream inside a styled container.
 * Handles three states:
 *   1. loading  — spinner while getUserMedia is resolving
 *   2. error    — permission denied / no device message
 *   3. idle     — "Start Camera" prompt before the user clicks
 *   4. streaming — live video + ScannerOverlay
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle, Loader2 } from 'lucide-react';
import ScannerOverlay from '@/components/ui/ScannerOverlay';
import type { CameraState } from '@/hooks/useCamera';
import { fadeIn } from '@/lib/animations';
import { useInspectionStore } from '@/store/inspectionStore';

interface CameraViewProps {
  camera: CameraState;
}

export default function CameraView({ camera }: CameraViewProps) {
  const { videoRef, isStreaming, isLoading, error } = camera;
  const status = useInspectionStore((s) => s.status);
  const isAnalyzing = status === 'detecting' || status === 'analyzing';

  // ── Auto-start camera on mount ─────────────────────────────────────────────
  useEffect(() => {
    camera.startCamera();
    return () => camera.stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-brand-border bg-brand-surface">

      {/* ── Live video element ──────────────────────────────────────────────── */}
      {/* Always rendered so the ref is attached; hidden when not streaming */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isStreaming ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Camera preview"
      />

      {/* ── Overlays (mutually exclusive) ───────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Loading spinner */}
        {isLoading && (
          <motion.div
            key="loading"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-surface/90"
          >
            <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
            <p className="text-sm text-brand-muted">Requesting camera…</p>
          </motion.div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <motion.div
            key="error"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center bg-brand-surface/90"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-warning/10">
              <AlertTriangle className="w-6 h-6 text-brand-warning" />
            </div>
            <p className="text-sm text-brand-white font-medium">Camera Unavailable</p>
            <p className="text-xs text-brand-muted leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* Idle (not loading, no error, not streaming yet) */}
        {!isLoading && !error && !isStreaming && (
          <motion.div
            key="idle"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-brand-surface/90"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full border border-brand-border bg-brand-highlight">
              <Camera className="w-7 h-7 text-brand-muted" />
            </div>
            <p className="text-sm text-brand-muted">Click &quot;Start Camera&quot; to begin</p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Scanner overlay (active while streaming or analyzing) ──────────── */}
      {isStreaming && (
        <ScannerOverlay active={!isAnalyzing} />
      )}

      {/* ── "LIVE" badge ────────────────────────────────────────────────────── */}
      {isStreaming && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5
                        rounded-full bg-brand-bg/70 backdrop-blur-sm border border-brand-border
                        px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-medium text-brand-white uppercase tracking-widest">Live</span>
        </div>
      )}

      {/* ── Facing mode badge ───────────────────────────────────────────────── */}
      {isStreaming && (
        <div className="absolute top-3 right-3 z-20 rounded-full bg-brand-bg/70 backdrop-blur-sm
                        border border-brand-border px-2.5 py-1">
          <span className="text-[10px] font-medium text-brand-muted uppercase tracking-widest">
            {camera.facingMode === 'user' ? 'Front' : 'Rear'}
          </span>
        </div>
      )}

    </div>
  );
}
