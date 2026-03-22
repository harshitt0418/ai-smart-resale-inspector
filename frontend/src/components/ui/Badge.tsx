/**
 * components/ui/Badge.tsx
 *
 * Compact label chip used for damage severity, status, confidence, etc.
 */

import { cn } from '@/lib/utils';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'blue' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  red:    'bg-brand-red/15    text-brand-red    border border-brand-red/30',
  green:  'bg-emerald-500/15  text-emerald-400  border border-emerald-500/30',
  yellow: 'bg-amber-500/15    text-amber-400    border border-amber-500/30',
  blue:   'bg-sky-500/15      text-sky-400      border border-sky-500/30',
  muted:  'bg-brand-highlight text-brand-muted  border border-brand-border',
};

export default function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
