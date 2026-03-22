import type { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Camera, FileSearch, DollarSign, FileText, Zap, Shield, GitBranch } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Docs — AI Smart Resale Inspector',
  description: 'How the AI Smart Resale Inspector pipeline works.',
};

const PIPELINE_STEPS = [
  {
    step: '01',
    icon: Camera,
    title: 'Image Input',
    color: 'text-brand-accent',
    bg:    'bg-brand-accent/10',
    desc:  'Provide a live camera capture or upload up to 4 photos (Front + Back required, Left and Right optional). Each photo is sent as the correct MIME type to all downstream services.',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Item Detection',
    color: 'text-blue-400',
    bg:    'bg-blue-400/10',
    desc:  'The front photo is forwarded to a YOLOv8 object-detection model running in the Python ML service (FastAPI, port 8000). It identifies the item category (Smartphone, Laptop, Tablet …), confidence score, and bounding box.',
  },
  {
    step: '03',
    icon: FileSearch,
    title: 'Damage Detection',
    color: 'text-brand-warning',
    bg:    'bg-brand-warning/10',
    desc:  'Every uploaded photo is independently analysed by a fine-tuned YOLOv8 damage model. It returns per-photo lists of damage regions (scratch, dent, crack, stain) with severity grades (minor / moderate / severe) and bounding boxes. All results are merged and tagged with their source photo.',
  },
  {
    step: '04',
    icon: Zap,
    title: 'Exact Model ID',
    color: 'text-purple-400',
    bg:    'bg-purple-400/10',
    desc:  'All uploaded photos are sent together in a single Gemini 1.5 Flash vision call (Google AI). Gemini reads brand logos, printed text, port shapes, camera configurations, and design language to identify the exact model (e.g. "iPhone 15 Pro") — or at minimum the brand and product line.',
  },
  {
    step: '05',
    icon: Shield,
    title: 'Severity Analysis',
    color: 'text-red-400',
    bg:    'bg-red-400/10',
    desc:  'Damage findings are scored by type and severity: minor counts 1×, moderate 3×, severe 8×. The weighted sum produces a 0–100 severity score that maps to condition grades A (Excellent) → D (Poor).',
  },
  {
    step: '06',
    icon: DollarSign,
    title: 'Market Pricing',
    color: 'text-emerald-400',
    bg:    'bg-emerald-400/10',
    desc:  'The exact model string is queried against the eBay India Browse API (GLOBAL-ID=EBAY-IN). The median of up to 15 current listings gives the live market price. When eBay is unavailable the system falls back to a curated INR new-price table with age-based depreciation curves per category.',
  },
  {
    step: '07',
    icon: GitBranch,
    title: 'Resale Price & Report',
    color: 'text-cyan-400',
    bg:    'bg-cyan-400/10',
    desc:  'The suggested resale price = market price × condition multiplier − estimated repair cost. A full PDF inspection report is generated with pdfkit and stored in backend/reports/. It is available for immediate download from the Reports page.',
  },
];

const TECH_STACK = [
  { category: 'Frontend',    items: ['Next.js 15 (App Router)', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Zustand'] },
  { category: 'Backend',     items: ['Node.js + Express', 'REST API (port 5000)', 'pdfkit', 'axios'] },
  { category: 'ML Service',  items: ['Python 3.11 + FastAPI (port 8000)', 'YOLOv8 (ONNX)', 'LightGBM', 'Ultralytics'] },
  { category: 'AI / Vision', items: ['Google Gemini 1.5 Flash', 'Multi-image single API call', 'Correct MIME-type passthrough'] },
  { category: 'Pricing',     items: ['eBay India Browse API', '1-hour in-memory cache', 'Graceful 429 fallback'] },
];

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-grotesk font-bold text-3xl text-brand-white mb-2">Documentation</h1>
        <p className="text-brand-muted text-base max-w-2xl">
          End-to-end walkthrough of the AI Smart Resale Inspector pipeline — from image input to PDF report.
        </p>
        <div className="mt-4">
          <Link href="/inspect">
            <Button variant="primary" size="sm">Try It Now →</Button>
          </Link>
        </div>
      </div>

      {/* Pipeline */}
      <section className="mb-12">
        <h2 className="font-grotesk font-semibold text-lg text-brand-white mb-4">Inspection Pipeline</h2>
        <div className="space-y-4">
          {PIPELINE_STEPS.map(({ step, icon: Icon, title, color, bg, desc }) => (
            <Card key={step} padding="none" className="flex gap-4 p-5">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-brand-muted text-xs font-mono">Step {step}</span>
                  <h3 className={`font-semibold text-sm ${color}`}>{title}</h3>
                </div>
                <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-12">
        <h2 className="font-grotesk font-semibold text-lg text-brand-white mb-4">Tech Stack</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {TECH_STACK.map(({ category, items }) => (
            <Card key={category} padding="none" className="p-4">
              <h3 className="text-brand-white text-sm font-semibold mb-2">{category}</h3>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item} className="text-brand-muted text-xs flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-brand-accent inline-block shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* API quick-ref */}
      <section>
        <h2 className="font-grotesk font-semibold text-lg text-brand-white mb-4">API Quick Reference</h2>
        <Card className="overflow-hidden" padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="px-4 py-3 text-brand-muted font-medium text-xs uppercase tracking-wide">Method</th>
                <th className="px-4 py-3 text-brand-muted font-medium text-xs uppercase tracking-wide">Endpoint</th>
                <th className="px-4 py-3 text-brand-muted font-medium text-xs uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {[
                ['POST', '/api/detect/item',              'Detect item category + bounding box from image'],
                ['POST', '/api/detect/damage',            'Detect damage regions from image'],
                ['POST', '/api/inspection/analyze-result','Run Parts 7–12: severity, pricing, model ID, report'],
                ['GET',  '/api/report/list',              'List all generated PDF reports'],
                ['GET',  '/api/report/:filename',         'Download a PDF report by filename'],
                ['GET',  '/api/health',                   'Health check — confirms backend + ML service status'],
              ].map(([method, path, desc]) => (
                <tr key={path} className="hover:bg-brand-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-bold ${method === 'GET' ? 'text-blue-400' : 'text-brand-accent'}`}>
                      {method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-white">{path}</td>
                  <td className="px-4 py-3 text-brand-muted text-xs">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
