/**
 * components/camera/CapturedPreview.tsx
 *
 * Shows the frozen snapshot taken from the camera stream alongside
 * a status indicator for the analysis pipeline.
 *
 * Replaces the live camera view once a frame is captured.
 * The user can discard and re-capture before a final result is saved.
 */

'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusIndicator from '@/components/ui/StatusIndicator';
import ScannerOverlay from '@/components/ui/ScannerOverlay';
import { useInspectionStore } from '@/store/inspectionStore';
import { fadeIn } from '@/lib/animations';

interface CapturedPreviewProps {
  frameDataUrl: string;
  onDiscard:    () => void;
}

export default function CapturedPreview({ frameDataUrl, onDiscard }: CapturedPreviewProps) {
  const status = useInspectionStore((s) => s.status);
  const isAnalyzing = status === 'detecting' || status === 'analyzing';

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-brand-border bg-brand-surface"
    >
      {/* Captured image */}
      <Image
        src={frameDataUrl}
        alt="Captured inspection frame"
        fill
        className="object-contain"
        unoptimized   // base-64 data URLs bypass Next.js optimisation
      />

      {/* Scanner overlay while analysis runs */}
      {isAnalyzing && <ScannerOverlay active={true} />}

      {/* Status pill */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2
                      rounded-full bg-brand-bg/80 backdrop-blur-sm border border-brand-border
                      px-3 py-1.5">
        <StatusIndicator status={status} showLabel />
      </div>

      {/* Discard button (hidden while analyzing) */}
      {!isAnalyzing && (
        <Button
          onClick={onDiscard}
          variant="ghost"
          size="sm"
          aria-label="Discard captured frame"
          className="absolute top-3 right-3 z-20 bg-brand-bg/70 backdrop-blur-sm border border-brand-border"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* "CAPTURED" badge */}
      <div className="absolute top-3 left-3 z-20 rounded-full bg-brand-bg/70 backdrop-blur-sm
                      border border-brand-border px-2.5 py-1">
        <span className="text-[10px] font-medium text-brand-muted uppercase tracking-widest">
          Captured
        </span>
      </div>
    </motion.div>
  );
}
