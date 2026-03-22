// ─── Layout ──────────────────────────────────────────────────────────────────
export { default as Navbar }       from './layout/Navbar';
export { default as Footer }       from './layout/Footer';
export { default as PageWrapper }  from './layout/PageWrapper';

// ─── UI Primitives ────────────────────────────────────────────────────────────
export { default as Button }           from './ui/Button';
export { default as Card }             from './ui/Card';
export { default as Badge }            from './ui/Badge';
export { default as GlowDivider }      from './ui/GlowDivider';
export { default as StatusIndicator }  from './ui/StatusIndicator';
export { default as AnimatedCounter }  from './ui/AnimatedCounter';
export { default as ScannerOverlay }   from './ui/ScannerOverlay';
export { default as ProgressBar }      from './ui/ProgressBar';
export { default as Skeleton, SkeletonResultCard } from './ui/LoadingSkeleton';

// ─── Home sections ────────────────────────────────────────────────────────────
export { default as HeroSection }     from './home/HeroSection';
export { default as StatsBar }        from './home/StatsBar';
export { default as FeaturesGrid }    from './home/FeaturesGrid';
export { default as PipelineSection } from './home/PipelineSection';
export { default as CTASection }      from './home/CTASection';

// ─── Camera module ───────────────────────────────────────────────────────────
export { CameraView, CameraControls, CapturedPreview } from './camera';

// ─── Inspect workspace ────────────────────────────────────────────────────────
export { default as InspectLayout } from './inspect/InspectLayout';
