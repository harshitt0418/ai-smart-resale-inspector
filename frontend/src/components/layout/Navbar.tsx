/**
 * components/layout/Navbar.tsx
 *
 * Top navigation bar — fixed, dark, with a subtle background blur.
 * Animates in on mount via Framer Motion.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScanLine, Github, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { useInspectionStore } from '@/store/inspectionStore';

export default function Navbar() {
  const status = useInspectionStore((s) => s.status);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 h-14
                 border-b border-brand-border
                 bg-[rgba(10,10,10,0.85)] backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-highlight border border-brand-border">
            <ScanLine className="w-4 h-4 text-brand-accent" />
          </span>
          <span className="font-grotesk font-semibold text-sm text-brand-white tracking-wide">
            RESALE<span className="text-brand-accent">AI</span>
          </span>
        </Link>

        {/* ── Centre nav links ───────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'Inspect',  href: '/inspect'  },
            { label: 'Reports',  href: '/reports'  },
            { label: 'Docs',     href: '/docs'     },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-brand-muted hover:text-brand-white transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {status !== 'idle' && (
            <StatusIndicator status={status} showLabel={true} />
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-white transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          <Link href="/inspect">
            <Button size="sm" leftIcon={<Zap className="w-3.5 h-3.5" />}>
              Start Scan
            </Button>
          </Link>
        </div>

      </div>
    </motion.header>
  );
}
