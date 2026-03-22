/**
 * components/ui/ScannerOverlay.tsx
 *
 * Layered scanning animation overlaid on the camera/image preview:
 *   • Subtle grid lines (brand-red tint)
 *   • Animated scan line sweeping top → bottom in a loop
 *   • Corner bracket decorations
 *
 * Pass `active={false}` to hide the scan line (e.g. when analysis is complete).
 */

'use client';

import { motion } from 'framer-motion';

interface ScannerOverlayProps {
  active?: boolean;
}

export default function ScannerOverlay({ active = true }: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {/* Grid overlay */}
      <div className="absolute inset-0 scan-grid opacity-60" />

      {/* Animated scan line */}
      {active && (
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-70"
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Corner brackets */}
      {/* Top-left */}
      <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-brand-accent rounded-tl" />
      {/* Top-right */}
      <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-brand-accent rounded-tr" />
      {/* Bottom-left */}
      <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-brand-accent rounded-bl" />
      {/* Bottom-right */}
      <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-brand-accent rounded-br" />

      {/* Pulsing border ring */}
      <motion.div
        className="absolute inset-0 rounded-xl border border-brand-accent/30"
        animate={{ borderColor: ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.50)', 'rgba(34,197,94,0.15)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
