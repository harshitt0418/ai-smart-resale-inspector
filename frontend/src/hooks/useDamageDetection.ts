/**
 * hooks/useDamageDetection.ts
 *
 * Sends a captured frame to the backend damage detection endpoint and
 * returns an array of damage regions (type, severity, confidence, bounding box).
 *
 * Falls back to the backend's deterministic demo when ML service is offline.
 */

import { useCallback, useState } from 'react';
import apiClient from '@/lib/apiClient';
import type { Damage } from '@/types';

export interface DamageDetectionState {
  damages:        Damage[];
  processedImage: string | null;  // Base64 JPEG of background-removed image
  isDetecting:    boolean;
  detectionError: string | null;
}

export function useDamageDetection() {
  const [state, setState] = useState<DamageDetectionState>({
    damages:        [],
    processedImage: null,
    isDetecting:    false,
    detectionError: null,
  });

  const detectDamage = useCallback(
    async (frameDataUrl: string): Promise<{ damages: Damage[]; processedImage?: string }> => {
      setState((s) => ({ ...s, isDetecting: true, detectionError: null }));

      try {
        const { data } = await apiClient.post<{ 
          success: boolean; 
          data: { damages: Damage[]; processedImage?: string } 
        }>(
          '/detect/damage',
          { image: frameDataUrl },
        );

        const damages = data.data?.damages ?? [];
        const processedImage = data.data?.processedImage ?? null;
        
        setState({ 
          damages, 
          processedImage: processedImage ? `data:image/jpeg;base64,${processedImage}` : null,
          isDetecting: false, 
          detectionError: null 
        });
        
        return { damages, processedImage: processedImage ? `data:image/jpeg;base64,${processedImage}` : undefined };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Damage detection failed';
        setState({ damages: [], processedImage: null, isDetecting: false, detectionError: msg });
        return { damages: [] };
      }
    },
    [],
  );

  const resetDamageDetection = useCallback(() => {
    setState({ damages: [], processedImage: null, isDetecting: false, detectionError: null });
  }, []);

  return { ...state, detectDamage, resetDamageDetection };
}
