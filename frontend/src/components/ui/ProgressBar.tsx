/**
 * components/ui/ProgressBar.tsx
 *
 * Animated horizontal progress bar — used for confidence levels,
 * damage severity, and analysis pipeline steps.
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;           // 0–100
  label?: string;
  showValue?: boolean;
  color?: 'red' | 'green' | 'amber' | 'sky';
  className?: string;
}

const colorStyles = {
  red:   'bg-brand-warning',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky:   'bg-sky-500',
};

export default function ProgressBar({
  value,
  label,
  showValue = true,
  color = 'red',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-brand-muted">{label}</span>}
          {showValue && <span className="text-xs font-medium text-brand-white">{clamped.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-brand-highlight overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorStyles[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
