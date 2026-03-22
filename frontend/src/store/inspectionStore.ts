/**
 * Global Zustand store — inspection session state.
 */
import { create } from 'zustand';
import type { Damage, DetectedItem, InputMode, InspectionResult, InspectionStatus, PhotoSlotId, UploadedPhotos } from '@/types';

interface InspectionStore {
  // ─── State ──────────────────────────────────────────────────────────────
  status:         InspectionStatus;
  capturedFrame:  string | null;
  detectedItem:   DetectedItem | null;
  damages:        Damage[];
  itemAgeYears:   number;
  result:         InspectionResult | null;
  error:          string | null;
  inputMode:      InputMode;
  uploadedPhotos: UploadedPhotos;

  // ─── Actions ────────────────────────────────────────────────────────────
  setStatus:          (status: InspectionStatus)          => void;
  setCapturedFrame:   (frame: string | null)               => void;
  setDetectedItem:    (item: DetectedItem | null)          => void;
  setDamages:         (damages: Damage[])                  => void;
  setItemAgeYears:    (years: number)                      => void;
  setResult:          (result: InspectionResult)           => void;
  setError:           (error: string | null)               => void;
  setInputMode:       (mode: InputMode)                    => void;
  setUploadedPhoto:   (slot: PhotoSlotId, dataUrl: string) => void;
  removeUploadedPhoto:(slot: PhotoSlotId)                  => void;
  clearUploadedPhotos:()                                   => void;
  reset:              ()                                   => void;
}

export const useInspectionStore = create<InspectionStore>((set) => ({
  status:         'idle',
  capturedFrame:  null,
  detectedItem:   null,
  damages:        [],
  itemAgeYears:   1,
  result:         null,
  error:          null,
  inputMode:      'camera',
  uploadedPhotos: {},

  setStatus:        (status)       => set({ status }),
  setCapturedFrame: (frame)        => set({ capturedFrame: frame }),
  setDetectedItem:  (item)         => set({ detectedItem: item }),
  setDamages:       (damages)      => set({ damages }),
  setItemAgeYears:  (years)        => set({ itemAgeYears: years }),
  setResult:        (result)       => set({ result, status: 'complete' }),
  setError:         (error)        => set({ error, status: 'error' }),
  setInputMode:     (mode)         => set({ inputMode: mode }),
  setUploadedPhoto: (slot, dataUrl) =>
    set((s) => ({ uploadedPhotos: { ...s.uploadedPhotos, [slot]: dataUrl } })),
  removeUploadedPhoto: (slot) =>
    set((s) => {
      const next = { ...s.uploadedPhotos };
      delete next[slot];
      return { uploadedPhotos: next };
    }),
  clearUploadedPhotos: () => set({ uploadedPhotos: {} }),
  reset: () =>
    set({
      status:         'idle',
      capturedFrame:  null,
      detectedItem:   null,
      damages:        [],
      result:         null,
      error:          null,
      uploadedPhotos: {},
    }),
}));

