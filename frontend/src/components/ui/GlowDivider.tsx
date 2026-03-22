/**
 * components/ui/GlowDivider.tsx
 *
 * Horizontal rule with a centered red glow — used as a section separator.
 */

import { cn } from '@/lib/utils';

export default function GlowDivider({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-brand-accent/25" />
      {/* Glow dot */}
      <div className="mx-3 h-1.5 w-1.5 rounded-full bg-brand-accent/60" />
      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-brand-accent/25" />
    </div>
  );
}
