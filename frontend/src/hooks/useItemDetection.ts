/**
 * hooks/useItemDetection.ts
 *
 * Sends a captured frame (base-64 data URL) to the backend detection endpoint
 * and returns the detected item label, confidence, and normalised bounding box.
 *
 * When the backend is unreachable, the endpoint itself returns a deterministic
 * demo result — so this hook always resolves successfully.
 */

import { useCallback, useState } from 'react';
import apiClient from '@/lib/apiClient';
import type { DetectedItem } from '@/types';

export interface ItemDetectionState {
  detectedItem:   DetectedItem | null;
  isDetecting:    boolean;
  detectionError: string | null;
}

export function useItemDetection() {
  const [state, setState] = useState<ItemDetectionState>({
    detectedItem:   null,
    isDetecting:    false,
    detectionError: null,
  });

  /**
   * Run item detection on a captured frame.
   * Accepts a full data-URL ("data:image/jpeg;base64,...") — the backend
   * strips the prefix before passing to the ML service.
   */
  const detectItem = useCallback(
    async (frameDataUrl: string): Promise<DetectedItem | null> => {
      setState((s) => ({ ...s, isDetecting: true, detectionError: null }));

      try {
        const { data } = await apiClient.post<{ success: boolean; data: DetectedItem }>(
          '/detect/item',
          { image: frameDataUrl },
        );

        const item = data.data;
        setState({ detectedItem: item, isDetecting: false, detectionError: null });
        return item;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Item detection failed';
        setState({ detectedItem: null, isDetecting: false, detectionError: msg });
        return null;
      }
    },
    [],
  );

  const resetDetection = useCallback(() => {
    setState({ detectedItem: null, isDetecting: false, detectionError: null });
  }, []);

  return { ...state, detectItem, resetDetection };
}
