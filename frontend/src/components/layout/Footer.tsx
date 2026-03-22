/**
 * components/layout/Footer.tsx
 *
 * Minimal dark footer with a red glow separator.
 */

import GlowDivider from '@/components/ui/GlowDivider';
import { ScanLine } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-border bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GlowDivider className="mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-highlight border border-brand-border">
              <ScanLine className="w-3.5 h-3.5 text-brand-accent" />
            </span>
            <span className="font-grotesk text-sm font-semibold text-brand-white">
              RESALE<span className="text-brand-accent">AI</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-brand-muted text-center">
            AI-powered item inspection &amp; resale valuation system
          </p>

          {/* Copyright */}
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} AI Smart Resale Inspector
          </p>
        </div>
      </div>
    </footer>
  );
}
