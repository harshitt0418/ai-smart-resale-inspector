/**
 * components/ui/LoadingSkeleton.tsx
 *
 * Animated shimmer skeleton blocks used while data is loading.
 * Configure width, height and optional rounded-full for avatars.
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: 'md' | 'lg' | 'full';
}

export default function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const roundedStyle = {
    md:   'rounded-md',
    lg:   'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={cn(
        'bg-brand-highlight animate-pulse',
        roundedStyle,
        className
      )}
    />
  );
}

/** Pre-composed skeleton for a result card row */
export function SkeletonResultCard() {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-7 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16" rounded="full" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
    </div>
  );
}
