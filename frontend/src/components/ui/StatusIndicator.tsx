/**
 * components/ui/StatusIndicator.tsx
 *
 * Animated pulsing dot that communicates the current inspection status.
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InspectionStatus } from '@/types';

interface StatusIndicatorProps {
  status: InspectionStatus;
  showLabel?: boolean;
  className?: string;
}

const config: Record<InspectionStatus, { color: string; label: string; pulse: boolean }> = {
  idle:      { color: 'bg-brand-muted/50', label: 'Idle',      pulse: false },
  scanning:  { color: 'bg-brand-accent',   label: 'Scanning',  pulse: true  },
  detecting: { color: 'bg-brand-accent',   label: 'Detecting', pulse: true  },
  analyzing: { color: 'bg-brand-accent',   label: 'Analyzing', pulse: true  },
  complete:  { color: 'bg-brand-accent',   label: 'Complete',  pulse: false },
  error:     { color: 'bg-brand-warning',  label: 'Error',     pulse: false },
};

export default function StatusIndicator({ status, showLabel = true, className }: StatusIndicatorProps) {
  const { color, label, pulse } = config[status];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <motion.span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', color)}
            animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', color)} />
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-brand-muted tracking-wide uppercase">{label}</span>
      )}
    </div>
  );
}
