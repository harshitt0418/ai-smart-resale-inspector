/**
 * components/ui/Card.tsx
 *
 * Dark glass-morphism card used throughout the dashboard.
 * Supports an optional animated glow border on hover.
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover } from '@/lib/animations';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Enable red glow on hover */
  glow?: boolean;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

export default function Card({ children, className, glow = false, padding = 'md' }: CardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover={glow ? 'hover' : 'rest'}
      variants={glow ? cardHover : undefined}
      className={cn(
        'rounded-xl border border-brand-border bg-brand-surface/85 backdrop-blur-[8px] shadow-card',
        'transition-colors duration-200',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
