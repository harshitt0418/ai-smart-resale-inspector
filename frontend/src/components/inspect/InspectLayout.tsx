/**
 * components/inspect/InspectLayout.tsx
 *
 * Two-column inspection workspace:
 *   Left  â€” Camera stream OR multi-photo upload panel
 *   Right â€” analysis result cards (Parts 5â€“12)
 *
 * New in this version:
 *   â€¢ Mode toggle: Camera â†” Upload Photos
 *   â€¢ PhotoUploadPanel with 4 labelled slots (Front required)
 *   â€¢ Upload analysis: detectItem on front photo,
 *     detectDamage on every uploaded photo â†’ merged results
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusIndicator from '@/components/ui/StatusIndicator';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { SkeletonResultCard } from '@/components/ui/LoadingSkeleton';
import { CameraView, CameraControls, CapturedPreview } from '@/components/camera';
import DetectionOverlay from '@/components/inspect/DetectionOverlay';
import DamageOverlay from '@/components/inspect/DamageOverlay';
import PhotoUploadPanel from '@/components/inspect/PhotoUploadPanel';
import { useCamera } from '@/hooks/useCamera';
import { useItemDetection } from '@/hooks/useItemDetection';
import { useDamageDetection } from '@/hooks/useDamageDetection';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useInspectionStore } from '@/store/inspectionStore';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { RefreshCw, Download, Camera, Upload } from 'lucide-react';
import type { PhotoSlotId } from '@/types';

export default function InspectLayout() {
  const camera = useCamera('environment');
  const { detectItem,   resetDetection }       = useItemDetection();
  const { detectDamage, resetDamageDetection } = useDamageDetection();
  const { analyze,      resetAnalysis }        = useAnalysis();
  const {
    status,
    reset,
    setCapturedFrame,
    setStatus,
    setDetectedItem,
    setDamages,
    setResult,
    capturedFrame,
    detectedItem,
    damages,
    itemAgeYears,
    setItemAgeYears,
    result,
    inputMode,
    setInputMode,
    clearUploadedPhotos,
  } = useInspectionStore();

  // Callback ref — fires exactly when the element mounts/unmounts, bypassing
  // AnimatePresence mode="wait" which delays mounting and makes a plain
  // useRef+useEffect miss the element (ref is still null when effect runs).
  const roRef                         = useRef<ResizeObserver | null>(null);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });
  
  // Store background-removed images for each photo slot
  const [processedImages, setProcessedImages] = useState<Partial<Record<PhotoSlotId | 'camera', string>>>({});
  const [showProcessed, setShowProcessed] = useState(false);  // Toggle between original and processed view

  const previewContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (roRef.current) { roRef.current.disconnect(); roRef.current = null; }
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPreviewSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    roRef.current = ro;
  }, []);

  const isLoading = status === 'detecting' || status === 'analyzing';

  // â”€â”€ Camera capture flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCapture = useCallback(async (frameDataUrl: string) => {
    setCapturedFrame(frameDataUrl);
    setStatus('detecting');

    const item = await detectItem(frameDataUrl);
    if (item) setDetectedItem(item);

    setStatus('analyzing');
    const { damages: found, processedImage } = await detectDamage(frameDataUrl);
    setDamages(found);
    
    // Store processed image for camera mode
    if (processedImage) {
      setProcessedImages({ camera: processedImage });
    }

    if (item) {
      const analysisResult = await analyze({ item, damages: found, itemAgeYears, image: frameDataUrl });
      if (analysisResult) setResult(analysisResult);
      else setStatus('complete');
    } else {
      setStatus('complete');
    }
  }, [setCapturedFrame, setStatus, setDetectedItem, setDamages, setResult,
      detectItem, detectDamage, analyze, itemAgeYears]);

  // â”€â”€ Upload analysis flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleUploadAnalyze = useCallback(async (
    photos: Partial<Record<PhotoSlotId, string>>,
  ) => {
    const frontPhoto = photos.front;
    if (!frontPhoto || !photos.back) return;

    // Show front photo as the preview
    setCapturedFrame(frontPhoto);
    setStatus('detecting');

    // Detect item from the front photo
    const item = await detectItem(frontPhoto);
    if (item) setDetectedItem(item);

    // Run damage detection on EVERY uploaded photo independently.
    // Tag each damage with its source photo so the overlay can filter
    // to front-photo coordinates. No dedup — different surfaces of the
    // same device legitimately have the same damage type at different locations.
    setStatus('analyzing');
    const photoEntries = Object.entries(photos) as [PhotoSlotId, string][];
    const processedImgs: Partial<Record<PhotoSlotId, string>> = {};
    
    const allDamageArrays = await Promise.all(
      photoEntries.map(async ([slotId, url]) => {
        const { damages: found, processedImage } = await detectDamage(url);
        // Store processed image for this slot
        if (processedImage) {
          processedImgs[slotId] = processedImage;
        }
        return found.map((d) => ({ ...d, photo: slotId }));
      }),
    );
    const allDamages = allDamageArrays.flat();
    setDamages(allDamages);
    setProcessedImages(processedImgs);

    const photoUrls = photoEntries.map(([, url]) => url);
    if (item) {
      const analysisResult = await analyze({ item, damages: allDamages, itemAgeYears, images: photoUrls });
      if (analysisResult) setResult(analysisResult);
      else setStatus('complete');
    } else {
      setStatus('complete');
    }
  }, [setCapturedFrame, setStatus, setDetectedItem, setDamages, setResult,
      detectItem, detectDamage, analyze, itemAgeYears]);

  const handleDiscard = useCallback(() => {
    reset(); resetDetection(); resetDamageDetection(); resetAnalysis();
    setProcessedImages({});
    setShowProcessed(false);
  }, [reset, resetDetection, resetDamageDetection, resetAnalysis]);

  const handleReset = useCallback(() => {
    reset(); resetDetection(); resetDamageDetection(); resetAnalysis();
    clearUploadedPhotos();
    setProcessedImages({});
    setShowProcessed(false);
  }, [reset, resetDetection, resetDamageDetection, resetAnalysis, clearUploadedPhotos]);

  const handleSwitchMode = useCallback((mode: typeof inputMode) => {
    if (mode === inputMode) return;
    handleReset();
    setInputMode(mode);
  }, [inputMode, handleReset, setInputMode]);


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-grotesk font-bold text-2xl text-brand-white">Inspection Workspace</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            {inputMode === 'camera'
              ? 'Point your camera at an item and capture to analyse'
              : 'Upload clear photos from all angles for best accuracy'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          {status !== 'idle' && (
            <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* â”€â”€ Input mode toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {status === 'idle' && (
        <div className="mb-6 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-brand-surface border border-brand-border rounded-lg p-1">
            <button
              onClick={() => handleSwitchMode('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                inputMode === 'camera'
                  ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40 shadow-sm'
                  : 'text-brand-muted hover:text-brand-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Camera
            </button>
            <button
              onClick={() => handleSwitchMode('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                inputMode === 'upload'
                  ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40 shadow-sm'
                  : 'text-brand-muted hover:text-brand-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Photos
            </button>
          </div>
          {inputMode === 'upload' && (
            <span className="text-xs text-brand-warning font-medium">
              ★ Better accuracy than camera
            </span>
          )}
        </div>
      )}

      {/* â”€â”€ Age input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {status === 'idle' && (
        <div className="mb-6 flex items-center gap-3 bg-brand-surface/50 border border-brand-border rounded-lg px-4 py-3 w-fit">
          <label className="text-brand-muted text-sm">Item age (years):</label>
          <input
            type="number" min={0} max={50} step={0.5}
            value={itemAgeYears}
            onChange={(e) => setItemAgeYears(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-20 bg-brand-highlight border border-brand-border rounded px-2 py-1 text-sm text-brand-white focus:outline-none focus:border-brand-accent/60"
          />
        </div>
      )}

      {/* â”€â”€ Main grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">

        {/* â”€â”€ Left: Camera / Upload / Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {/* After capture: always show captured preview + overlays */}
            {capturedFrame ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                ref={previewContainerRef}
                className="relative"
              >
                {/* Toggle button for showing processed image */}
                {Object.keys(processedImages).length > 0 && (
                  <div className="absolute top-4 right-4 z-20">
                    <Button
                      size="sm"
                      variant={showProcessed ? 'primary' : 'secondary'}
                      onClick={() => setShowProcessed(!showProcessed)}
                      className="backdrop-blur-sm bg-opacity-90"
                    >
                      {showProcessed ? '🔍 BG Removed' : '📷 Original'}
                    </Button>
                  </div>
                )}
                
                <CapturedPreview 
                  frameDataUrl={
                    showProcessed && (processedImages.camera || processedImages.front)
                      ? (processedImages.camera || processedImages.front)!
                      : capturedFrame
                  } 
                  onDiscard={handleDiscard} 
                />
                {detectedItem && status === 'complete' && previewSize.w > 0 && (
                  <DetectionOverlay item={detectedItem} containerWidth={previewSize.w} containerHeight={previewSize.h} />
                )}
                {damages.length > 0 && status === 'complete' && previewSize.w > 0 && (
                  <DamageOverlay
                    damages={damages.filter((d) => !d.photo || d.photo === 'front')}
                    containerWidth={previewSize.w}
                    containerHeight={previewSize.h}
                  />
                )}
              </motion.div>
            ) : inputMode === 'upload' ? (
              /* Upload panel */
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <PhotoUploadPanel
                  onAnalyze={handleUploadAnalyze}
                  isLoading={isLoading}
                />
              </motion.div>
            ) : (
              /* Camera view */
              <motion.div
                key="camera"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
              >
                <CameraView camera={camera} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera controls (only in camera mode, before capture) */}
          {inputMode === 'camera' && !capturedFrame && status !== 'complete' && (
            <CameraControls camera={camera} onCapture={handleCapture} />
          )}

          {/* Post-analysis actions */}
          {status === 'complete' && (
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="secondary" className="flex-1"
                leftIcon={<RefreshCw className="w-4 h-4" />}>
                Scan Another Item
              </Button>
              {result?.reportUrl && (
                <Button
                  variant="primary"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => window.open(
                    `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000'}${result.reportUrl}`,
                    '_blank',
                  )}
                >
                  Download Report
                </Button>
              )}
            </div>
          )}
        </div>

        {/* â”€â”€ Right: Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">

          {/* Item */}
          <motion.div variants={staggerItem}>
            {isLoading ? <SkeletonResultCard /> : (
              <ResultCard
                label="Detected Item"
                value={
                  result?.item?.modelSource === 'gemini' && result.item.exactModel
                    ? result.item.exactModel
                    : detectedItem ? detectedItem.label : status === 'complete' ? 'Not detected' : '\u2014'
                }
                sub={
                  detectedItem
                    ? result?.item?.modelSource === 'gemini'
                      ? `${result.item.label} · AI identified · ${Math.round(detectedItem.confidence * 100)}% confidence`
                      : `${result?.item?.label ?? detectedItem.label} · ${Math.round(detectedItem.confidence * 100)}% confidence`
                    : 'Waiting for scan'
                }
                accent="red"
              />
            )}
          </motion.div>

          {/* Damages */}
          <motion.div variants={staggerItem}>
            {isLoading ? <SkeletonResultCard /> : (
              <ResultCard
                label="Damage Detected"
                value={status === 'complete'
                  ? damages.length > 0 ? `${damages.length} issue${damages.length !== 1 ? 's' : ''}` : 'None found'
                  : '—'}
                sub={status === 'complete' && damages.length > 0
                  ? damages.map((d) => `${d.severity} ${d.type}`).slice(0, 2).join(' · ')
                    + (damages.length > 2 ? ` +${damages.length - 2} more` : '')
                  : 'Waiting for scan'}
                accent="yellow"
              />
            )}
          </motion.div>

          {/* Condition Grade â€” Part 7 */}
          <motion.div variants={staggerItem}>
            {isLoading ? <SkeletonResultCard /> : (
              <ConditionCard result={result} status={status} />
            )}
          </motion.div>

          {/* Repair Cost — Part 8 */}
          <motion.div variants={staggerItem}>
            {isLoading ? <SkeletonResultCard /> : (
              <ResultCard
                label="Repair Cost Estimate"
                value={result
                  ? result.repairCost.min === 0 && result.repairCost.max === 0
                    ? 'No repair needed'
                    : `₹${result.repairCost.min.toLocaleString('en-IN')} – ₹${result.repairCost.max.toLocaleString('en-IN')}`
                  : '—'}
                sub={result ? `${result.repairCost.currency} estimate based on damage analysis` : 'Waiting for scan'}
                accent="yellow"
              />
            )}
          </motion.div>

          {/* Market Value â€” Parts 9â€“10 */}
          <motion.div variants={staggerItem}>
            {isLoading ? <SkeletonResultCard /> : (
              <ResultCard
                label="Current Market Value"
                value={result ? `₹${result.marketPrice.currentPrice.toLocaleString('en-IN')}` : '—'}
                sub={result
                  ? `New price ₹${result.marketPrice.newPrice.toLocaleString('en-IN')} · age ${result.itemAgeYears}yr`
                  : 'Waiting for scan'}
                accent="green"
              />
            )}
          </motion.div>

          {/* Resale Price â€” Part 11 */}
          <motion.div variants={staggerItem}>
            {isLoading ? <SkeletonResultCard /> : (
              <ResultCard
                label="Suggested Resale Price"
                value={result ? `₹${result.suggestedResalePrice.toLocaleString('en-IN')}` : '—'}
                sub={result
                  ? `Grade ${result.conditionGrade} · ${result.conditionLabel}`
                  : 'Waiting for scan'}
                accent="green"
                highlight
              />
            )}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}


/* â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface ResultCardProps {
  label:     string;
  value:     string;
  sub:       string;
  accent:    'red' | 'yellow' | 'green';
  highlight?: boolean;
}

const accentStyles = {
  red:    'text-brand-red',
  yellow: 'text-amber-400',
  green:  'text-emerald-400',
};

function ResultCard({ label, value, sub, accent, highlight = false }: ResultCardProps) {
  return (
    <Card glow={highlight} className={highlight ? 'border-brand-accent/25 bg-brand-accent/5' : ''}>
      <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-grotesk font-bold text-2xl ${accentStyles[accent]}`}>{value}</p>
      <p className="text-xs text-brand-muted mt-1">{sub}</p>
    </Card>
  );
}

// Condition grade card with colour-coded badge
const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  B: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  C: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
  D: 'bg-amber-700/20 border-amber-700/40 text-amber-600',
};

function ConditionCard({ result, status }: { result: import('@/types').InspectionResult | null; status: string }) {
  if (!result) {
    return (
      <Card>
        <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">Condition Grade</p>
        <p className="font-grotesk font-bold text-2xl text-brand-muted">â€”</p>
        <p className="text-xs text-brand-muted mt-1">Waiting for scan</p>
      </Card>
    );
  }

  const gradeStyle = GRADE_STYLES[result.conditionGrade] ?? GRADE_STYLES.C;
  return (
    <Card>
      <p className="text-xs text-brand-muted uppercase tracking-wide mb-3">Condition Grade</p>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${gradeStyle}`}>
          <span className="font-grotesk font-black text-3xl">{result.conditionGrade}</span>
        </div>
        <div>
          <p className="font-grotesk font-bold text-lg text-brand-white">{result.conditionLabel}</p>
          <p className="text-xs text-brand-muted">Severity score: {result.severityScore} / 100</p>
        </div>
      </div>
    </Card>
  );
}


