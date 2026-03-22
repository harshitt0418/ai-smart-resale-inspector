/**
 * components/home/FeaturesGrid.tsx
 *
 * Three-column grid of feature cards — each one animates in when
 * it enters the viewport.
 */

'use client';

import { motion } from 'framer-motion';
import {
  ScanLine, AlertTriangle, Wrench, TrendingDown,
  DollarSign, FileText, Zap, Clock
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { staggerContainer, staggerItem } from '@/lib/animations';

const FEATURES = [
  {
    icon: <ScanLine     className="w-5 h-5" />,
    title: 'Item Detection',
    description: 'YOLOv8 identifies 80+ item categories from a single camera frame with 94%+ accuracy.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Damage Detection',
    description: 'Fine-tuned model pinpoints scratches, dents, cracks, and stains — with bounding boxes.',
  },
  {
    icon: <Wrench       className="w-5 h-5" />,
    title: 'Repair Cost Prediction',
    description: 'LightGBM model trained on repair data estimates min/max repair cost per damage type.',
  },
  {
    icon: <TrendingDown  className="w-5 h-5" />,
    title: 'Depreciation Engine',
    description: 'Compound annual depreciation rates per category give an accurate current value.',
  },
  {
    icon: <DollarSign   className="w-5 h-5" />,
    title: 'Market Price Estimation',
    description: 'Combines live market signals with depreciation to estimate today\'s buyer price.',
  },
  {
    icon: <FileText     className="w-5 h-5" />,
    title: 'PDF Report Generation',
    description: 'One-click professional inspection report with images, scores, and cost breakdown.',
  },
  {
    icon: <Zap          className="w-5 h-5" />,
    title: 'Real-time Streaming',
    description: 'Socket.IO pipeline streams partial results as each stage completes — no waiting.',
  },
  {
    icon: <Clock        className="w-5 h-5" />,
    title: 'Session History',
    description: 'Every scan is persisted in MongoDB Atlas — review and compare past inspections.',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs uppercase tracking-widest text-brand-accent/80 font-medium">Capabilities</span>
          <h2 className="font-grotesk font-bold text-3xl sm:text-4xl text-brand-white">
            Everything in one scan
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto text-sm leading-relaxed">
            A complete AI pipeline from camera capture to final resale price,
            with a professional PDF report delivered at the end.
          </p>
        </div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURES.map(({ icon, title, description }) => (
            <motion.div key={title} variants={staggerItem}>
              <Card glow className="h-full group">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-brand-accent/10 text-brand-accent mb-4
                                group-hover:bg-brand-accent/20 transition-colors duration-200">
                  {icon}
                </div>
                {/* Title */}
                <h3 className="font-semibold text-sm text-brand-white mb-1.5">{title}</h3>
                {/* Description */}
                <p className="text-xs text-brand-muted leading-relaxed">{description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
