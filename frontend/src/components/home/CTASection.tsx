/**
 * components/home/CTASection.tsx
 *
 * Bottom call-to-action banner before the footer.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fadeUp } from '@/lib/animations';

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-60" />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 max-w-2xl mx-auto px-4 text-center space-y-6"
      >
        <h2 className="font-grotesk font-bold text-3xl sm:text-4xl text-brand-white leading-tight">
          Ready to inspect your first item?
        </h2>
        <p className="text-brand-muted text-base">
          Start a scan in seconds — no setup, no account required.
        </p>
        <Link href="/inspect">
          <Button size="lg" leftIcon={<Zap className="w-4 h-4" />} className="mx-auto">
            Launch Inspector
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
