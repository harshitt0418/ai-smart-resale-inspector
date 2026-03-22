/**
 * components/home/HeroSection.tsx
 *
 * Full-viewport hero with:
 *   • Radial red glow background
 *   • Animated headline with staggered words
 *   • Feature tags row
 *   • CTA buttons
 *   • Animated scan-preview mockup
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, FileText, ShieldCheck, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import ScannerOverlay from '@/components/ui/ScannerOverlay';
import { staggerContainer, staggerItem, fadeIn } from '@/lib/animations';

const FEATURES = [
  { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'YOLOv8 Detection'    },
  { icon: <TrendingUp  className="w-3.5 h-3.5" />, label: 'Price Estimation'    },
  { icon: <FileText    className="w-3.5 h-3.5" />, label: 'PDF Report'          },
  { icon: <Zap         className="w-3.5 h-3.5" />, label: 'Real-time Analysis'  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-56px)] flex items-center overflow-hidden">

      {/* ── Radial glow background ────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      {/* ── Subtle grid ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 scan-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left — Text ──────────────────────────────────────────────── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Eyebrow */}
            <motion.div variants={staggerItem}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
                AI-Powered Inspection System
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={staggerItem}
              className="font-grotesk font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-brand-white"
            >
              Scan. Detect.
              <br />
              <span className="text-brand-accent">Value.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={staggerItem}
              className="text-brand-muted text-lg leading-relaxed max-w-md"
            >
              Point your camera at any item and get an instant AI inspection —
              damage detection, repair cost, depreciation, and a professional
              resale report in seconds.
            </motion.p>

            {/* Feature tags */}
            <motion.div variants={staggerItem} className="flex flex-wrap gap-2">
              {FEATURES.map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border
                             bg-brand-surface px-3 py-1.5 text-xs text-brand-muted"
                >
                  <span className="text-brand-accent">{icon}</span>
                  {label}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={staggerItem} className="flex flex-wrap gap-3 pt-2">
              <Link href="/inspect">
                <Button size="lg" leftIcon={<Zap className="w-4 h-4" />}>
                  Start Inspection
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="secondary">
                  View Docs
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right — Scanner mockup ────────────────────────────────────── */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="relative hidden lg:block"
          >
            {/* Outer glow container */}
            <div className="relative rounded-2xl overflow-hidden border border-brand-border shadow-glow-green">
              {/* Placeholder dark "camera" view */}
              <div className="aspect-[4/3] bg-brand-surface flex flex-col items-center justify-center gap-4">
                {/* Fake bounding box */}
                <div className="relative w-44 h-32">
                  <div className="absolute inset-0 rounded-lg border-2 border-brand-accent/50 bg-brand-accent/5" />
                  {/* Item label */}
                  <div className="absolute -top-6 left-0">
                    <span className="bg-brand-accent text-brand-bg text-[10px] font-medium px-2 py-0.5 rounded">
                      Smartphone · 94%
                    </span>
                  </div>
                  {/* Damage marker */}
                  <div className="absolute top-4 right-6">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                    </span>
                  </div>
                </div>

                {/* Status line */}
                <p className="text-xs text-brand-muted tracking-widest uppercase animate-pulse">
                  Analyzing damage…
                </p>
              </div>

              {/* Scanner overlay sits on top */}
              <ScannerOverlay active={true} />
            </div>

            {/* Floating result chip — repair cost */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -right-8 top-12 rounded-xl border border-brand-border bg-brand-surface/90
                         backdrop-blur-sm px-4 py-3 shadow-card min-w-[140px]"
            >
              <p className="text-[10px] text-brand-muted uppercase tracking-wide mb-0.5">Repair Cost</p>
              <p className="text-lg font-bold text-brand-warning font-grotesk">₹3,500–₹7,000</p>
            </motion.div>

            {/* Floating result chip — resale price */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute -left-8 bottom-12 rounded-xl border border-brand-border bg-brand-surface/90
                         backdrop-blur-sm px-4 py-3 shadow-card min-w-[140px]"
            >
              <p className="text-[10px] text-brand-muted uppercase tracking-wide mb-0.5">Resale Price</p>
              <p className="text-lg font-bold text-emerald-400 font-grotesk">₹27,000</p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
