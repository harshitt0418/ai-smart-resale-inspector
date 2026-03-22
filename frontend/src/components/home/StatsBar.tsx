/**
 * components/home/StatsBar.tsx
 *
 * Animated stats strip between hero and features — shows off the system's
 * capabilities with animated counters.
 */

'use client';

import { motion } from 'framer-motion';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GlowDivider from '@/components/ui/GlowDivider';
import { staggerContainer, staggerItem } from '@/lib/animations';

const STATS = [
  { value: 80,   suffix: '+',  label: 'Item Categories'     },
  { value: 94.7, suffix: '%',  label: 'Detection Accuracy', decimals: 1 },
  { value: 3,    suffix: 's',  label: 'Avg Analysis Time'   },
  { value: 12,   suffix: '',   label: 'Pipeline Steps'      },
];

export default function StatsBar() {
  return (
    <section className="py-10 border-y border-brand-border bg-brand-surface/40">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-brand-border"
        >
          {STATS.map(({ value, suffix, label, decimals }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="flex flex-col items-center text-center px-6"
            >
              <span className="font-grotesk font-bold text-3xl text-brand-accent">
                <AnimatedCounter value={value} suffix={suffix} decimals={decimals ?? 0} />
              </span>
              <span className="mt-1 text-xs text-brand-muted uppercase tracking-widest">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <GlowDivider className="mt-10 max-w-7xl mx-auto px-4" />
    </section>
  );
}
