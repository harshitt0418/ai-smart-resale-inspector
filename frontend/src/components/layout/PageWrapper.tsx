/**
 * components/layout/PageWrapper.tsx
 *
 * Animates page content in on route change.
 * Wrap every page's <main> content inside this component.
 */

'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
