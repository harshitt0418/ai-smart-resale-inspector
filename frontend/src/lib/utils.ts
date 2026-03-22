/**
 * Reusable utility: merges Tailwind class names safely.
 * Uses clsx for conditional classes + tailwind-merge to resolve conflicts.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
