/**
 * components/camera/CameraControls.tsx
 *
 * Control bar below the camera view:
 *   • Start / Stop toggle
 *   • Capture frame (triggers inspection pipeline)
 *   • Switch front / rear camera
 *   • Reset inspection
 */

'use client';

import { motion } from 'framer-motion';
import { Camera, CameraOff, FlipHorizontal2, ScanLine, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { CameraState } from '@/hooks/useCamera';
import { useInspectionStore } from '@/store/inspectionStore';

interface CameraControlsProps {
  camera:       CameraState;
  onCapture:    (frameDataUrl: string) => void;
}

export default function CameraControls({ camera, onCapture }: CameraControlsProps) {
  const { isStreaming, isLoading, startCamera, stopCamera, switchCamera, captureFrame } = camera;
  const { status, reset } = useInspectionStore();

  const isBusy = status === 'detecting' || status === 'analyzing';

  function handleCapture() {
    const frame = captureFrame();
    if (!frame) return;
    onCapture(frame);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex items-center gap-2"
    >
      {/* ── Start / Stop ─────────────────────────────────────────────────── */}
      {!isStreaming ? (
        <Button
          onClick={startCamera}
          loading={isLoading}
          leftIcon={<Camera className="w-4 h-4" />}
          className="flex-1"
        >
          Start Camera
        </Button>
      ) : (
        <Button
          onClick={stopCamera}
          variant="secondary"
          leftIcon={<CameraOff className="w-4 h-4" />}
        >
          Stop
        </Button>
      )}

      {/* ── Capture & analyze ────────────────────────────────────────────── */}
      <Button
        onClick={handleCapture}
        disabled={!isStreaming || isBusy}
        loading={isBusy}
        leftIcon={<ScanLine className="w-4 h-4" />}
        className="flex-1"
      >
        {isBusy ? 'Analyzing…' : 'Capture & Analyze'}
      </Button>

      {/* ── Switch camera ────────────────────────────────────────────────── */}
      <Button
        onClick={switchCamera}
        disabled={!isStreaming || isBusy}
        variant="ghost"
        size="md"
        aria-label="Switch camera"
      >
        <FlipHorizontal2 className="w-4 h-4" />
      </Button>

      {/* ── Reset (visible only after a scan) ───────────────────────────── */}
      {status !== 'idle' && (
        <Button
          onClick={reset}
          variant="ghost"
          size="md"
          aria-label="Reset inspection"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
