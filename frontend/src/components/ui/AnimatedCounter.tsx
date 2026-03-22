/**
 * components/ui/AnimatedCounter.tsx
 *
 * Smoothly animates a number from 0 to `value` when it enters the viewport.
 * Used on the results dashboard to reveal prices with motion.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;   // e.g. "$"
  suffix?: string;   // e.g. " USD"
  decimals?: number;
  duration?: number; // ms
  className?: string;
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1200,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView) return;

    const start     = performance.now();
    const startVal  = 0;
    const endVal    = value;

    function tick(now: number) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + eased * (endVal - startVal));

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  const formatted = display.toFixed(decimals);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
