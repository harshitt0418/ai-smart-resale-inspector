/**
 * components/home/PipelineSection.tsx
 *
 * Visual step-by-step pipeline diagram showing the 12-stage AI flow.
 * Steps reveal with a left-to-right stagger.
 */

'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

const STEPS = [
  { num: '01', label: 'Camera Capture'         },
  { num: '02', label: 'Item Detection'         },
  { num: '03', label: 'Damage Mapping'         },
  { num: '04', label: 'Severity Grading'       },
  { num: '05', label: 'Repair Cost Estimate'   },
  { num: '06', label: 'Age Depreciation'       },
  { num: '07', label: 'Market Price Lookup'    },
  { num: '08', label: 'Final Price Engine'     },
  { num: '09', label: 'Report Generation'      },
];

export default function PipelineSection() {
  return (
    <section className="py-20 border-t border-brand-border bg-brand-surface/20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-brand-accent/80 font-medium">Pipeline</span>
          <h2 className="font-grotesk font-bold text-3xl sm:text-4xl text-brand-white">
            How it works
          </h2>
        </div>

        {/* Steps */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4"
        >
          {STEPS.map(({ num, label }, idx) => (
            <motion.div
              key={num}
              variants={staggerItem}
              className="flex flex-col items-center text-center gap-2 relative"
            >
              {/* Connector line (all except last) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-4 left-[calc(50%+16px)] right-[-calc(50%-16px)]
                                h-px bg-gradient-to-r from-brand-accent/30 to-transparent w-full" />
              )}

              {/* Circle */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                              border border-brand-accent/40 bg-brand-accent/10 text-brand-accent text-[10px] font-bold">
                {num}
              </div>

              {/* Label */}
              <span className="text-[10px] text-brand-muted leading-tight">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
