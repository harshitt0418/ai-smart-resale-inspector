/**
 * components/ui/Button.tsx
 *
 * Primary interactive button with three variants:
 *   • primary  — filled red, glow on hover
 *   • secondary — outlined red
 *   • ghost    — transparent, subtle on hover
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buttonTap } from '@/lib/animations';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-red text-brand-bg border border-brand-red/60 ' +
    'hover:bg-brand-red-glow hover:border-brand-red-glow ' +
    'active:bg-brand-red-dim active:border-brand-red-dim',
  secondary:
    'bg-transparent text-brand-red border border-brand-red/40 ' +
    'hover:bg-brand-red/10 hover:border-brand-red/70',
  ghost:
    'bg-transparent text-brand-muted border border-brand-border ' +
    'hover:text-brand-white hover:border-brand-red/40',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8  px-3 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileTap={buttonTap}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
          <Spinner />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default Button;
