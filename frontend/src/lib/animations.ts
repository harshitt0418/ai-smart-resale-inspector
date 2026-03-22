/**
 * lib/animations.ts
 *
 * Centralised Framer Motion animation variants.
 * Import the variant you need — keeps component files clean.
 */

import type { Variants } from 'framer-motion';

// ─── Page / section entrance ─────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ─── Stagger container (parent wraps a list of children) ─────────────────────

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Card hover ──────────────────────────────────────────────────────────────

export const cardHover = {
  rest:  { scale: 1,    boxShadow: '0 4px 32px rgba(0,0,0,0.80)' },
  hover: { scale: 1.02, boxShadow: '0 0 28px rgba(34,197,94,0.12)' },
};

// ─── Button press ────────────────────────────────────────────────────────────

export const buttonTap = { scale: 0.96 };

// ─── Scanning line (looped) ──────────────────────────────────────────────────

export const scanLine = {
  initial:  { top: '0%' },
  animate:  { top: '100%' },
  transition: { duration: 2, repeat: Infinity, ease: 'linear' },
};

// ─── Pulsing glow ring ───────────────────────────────────────────────────────

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(34,197,94,0)',
      '0 0 20px rgba(34,197,94,0.20)',
      '0 0 0px rgba(34,197,94,0)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Number counter (used by AnimatedCounter) ────────────────────────────────

export const counterTransition = { duration: 1.2, ease: 'easeOut' };
