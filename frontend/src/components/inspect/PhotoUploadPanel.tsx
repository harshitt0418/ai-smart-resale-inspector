/**
 * components/inspect/PhotoUploadPanel.tsx
 *
 * Multi-slot photo upload panel.
 * Slots: Front (required), Back (required), Left Side, Right Side.
 * Reads files via FileReader → base64 data URLs.
 * Supports click-to-upload and drag-and-drop.
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useInspectionStore } from '@/store/inspectionStore';
import type { PhotoSlot, PhotoSlotId } from '@/types';

// ── Slot definitions ──────────────────────────────────────────────────────────

const PHOTO_SLOTS: PhotoSlot[] = [
  {
    id:          'front',
    label:       'Front',
    required:    true,
    description: 'Main face of the item — most important for identification',
  },
  {
    id:          'back',
    label:       'Back',
    required:    true,
    description: 'Rear view — helps reveal hidden damage',
  },
  {
    id:          'left',
    label:       'Left Side',
    required:    false,
    description: 'Left-side panel — catches side scratches & dents',
  },
  {
    id:          'right',
    label:       'Right Side',
    required:    false,
    description: 'Right-side panel — catches side scratches & dents',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024; // ≤ 10 MB
}

// ── Single slot card ──────────────────────────────────────────────────────────

interface SlotCardProps {
  slot:      PhotoSlot;
  dataUrl:   string | undefined;
  onUpload:  (slot: PhotoSlotId, dataUrl: string) => void;
  onRemove:  (slot: PhotoSlotId) => void;
  disabled:  boolean;
}

function SlotCard({ slot, dataUrl, onUpload, onRemove, disabled }: SlotCardProps) {
  const inputRef     = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!isValidImageFile(file)) return;
    const url = await readFileAsDataUrl(file);
    onUpload(slot.id, url);
  }, [slot.id, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const isRequired = slot.required;
  const hasPhoto    = !!dataUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-xl border-2 transition-colors overflow-hidden
        ${hasPhoto
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : isRequired
            ? 'border-brand-accent/50 bg-brand-accent/5'
            : 'border-brand-border bg-brand-surface/40'}
        ${drag ? 'border-blue-400 bg-blue-500/10 scale-[1.01]' : ''}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Badge row */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          {isRequired && !hasPhoto && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-brand-accent bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
              <Star className="w-2.5 h-2.5 fill-brand-accent" />
              Required
            </span>
          )}
          {hasPhoto && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Added
            </span>
          )}
          {!isRequired && !hasPhoto && (
            <span className="text-[10px] text-brand-muted bg-brand-surface border border-brand-border px-2 py-0.5 rounded-full uppercase tracking-wide">
              Optional
            </span>
          )}
        </div>

        {hasPhoto && (
          <button
            onClick={() => onRemove(slot.id)}
            className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/40 transition-colors"
          >
            <X className="w-3 h-3 text-brand-muted" />
          </button>
        )}
      </div>

      {/* Preview / placeholder */}
      <div
        className="mx-3 mb-3 rounded-lg overflow-hidden cursor-pointer"
        style={{ height: 120 }}
        onClick={() => !hasPhoto && inputRef.current?.click()}
      >
        {hasPhoto ? (
          <div className="relative w-full h-full group" onClick={() => inputRef.current?.click()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt={slot.label}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <Upload className="w-5 h-5 text-white" />
              <span className="text-white text-xs ml-1">Replace</span>
            </div>
          </div>
        ) : (
          <div className={`
            w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
            ${isRequired ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-brand-border bg-brand-dark/40'}
            ${drag ? 'border-blue-400' : ''}
            hover:border-brand-accent/50 transition-colors
          `}>
            <Camera className="w-7 h-7 text-brand-muted" />
            <p className="text-xs text-brand-muted text-center px-1">
              {drag ? 'Drop here' : 'Click or drag photo'}
            </p>
          </div>
        )}
      </div>

      {/* Slot label + description */}
      <div className="px-3 pb-3">
        <p className="text-sm font-semibold text-brand-white">{slot.label}</p>
        <p className="text-[11px] text-brand-muted mt-0.5 leading-snug">{slot.description}</p>
      </div>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface PhotoUploadPanelProps {
  onAnalyze: (photos: Partial<Record<PhotoSlotId, string>>) => void;
  isLoading: boolean;
}

export default function PhotoUploadPanel({ onAnalyze, isLoading }: PhotoUploadPanelProps) {
  const { uploadedPhotos, setUploadedPhoto, removeUploadedPhoto } = useInspectionStore();

  const hasFront   = !!uploadedPhotos.front;
  const hasBack    = !!uploadedPhotos.back;
  const hasRequired = hasFront && hasBack;
  const photoCount = Object.keys(uploadedPhotos).length;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300 leading-relaxed">
          <span className="font-semibold">Front + Back photos are required</span> — upload all 4 sides for the most accurate damage detection.
          Each photo is analysed independently; scratches visible from any angle will be captured.
        </p>
      </div>

      {/* 2×2 slot grid */}
      <div className="grid grid-cols-2 gap-3">
        {PHOTO_SLOTS.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            dataUrl={uploadedPhotos[slot.id]}
            onUpload={setUploadedPhoto}
            onRemove={removeUploadedPhoto}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-brand-muted text-center">
        JPG / PNG / WEBP · max 10 MB per photo
      </p>

      {/* CTA */}
      <Button
        variant="primary"
        className="w-full"
        disabled={!hasRequired || isLoading}
        onClick={() => onAnalyze(uploadedPhotos)}
        leftIcon={<Upload className="w-4 h-4" />}
      >
        {isLoading
          ? 'Analysing…'
          : hasRequired
            ? `Analyse ${photoCount} Photo${photoCount !== 1 ? 's' : ''}`
            : !hasFront
              ? 'Add Front Photo to Continue'
              : 'Add Back Photo to Continue'}
      </Button>
    </div>
  );
}
