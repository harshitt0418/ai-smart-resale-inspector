/**
 * hooks/useAnalysis.ts
 *
 * Sends pre-detected item + damages to the backend's analyze-result endpoint
 * (POST /api/inspection/analyze-result) which runs Parts 7–12:
 *   • Damage severity scoring  (Part 7)
 *   • Repair cost estimation   (Part 8)
 *   • Market price / depreciation (Parts 9–10)
 *   • Suggested resale price   (Part 11)
 *   • PDF report generation    (Part 12)
 */

import { useCallback, useState } from 'react';
import apiClient from '@/lib/apiClient';
import type { Damage, DetectedItem, InspectionResult } from '@/types';

interface AnalysisInput {
  item:         DetectedItem;
  damages:      Damage[];
  itemAgeYears: number;
  /** Single image (camera mode) */
  image?:       string;
  /** All uploaded photos (upload mode) — sent to Gemini for multi-angle identification */
  images?:      string[];
}

interface AnalysisState {
  result:       InspectionResult | null;
  isAnalyzing:  boolean;
  analysisError: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    result:        null,
    isAnalyzing:   false,
    analysisError: null,
  });

  const analyze = useCallback(
    async ({ item, damages, itemAgeYears, image, images }: AnalysisInput): Promise<InspectionResult | null> => {
      setState((s) => ({ ...s, isAnalyzing: true, analysisError: null }));

      try {
        const { data } = await apiClient.post<{ success: boolean; data: InspectionResult }>(
          '/inspection/analyze-result',
          { item, damages, itemAgeYears, image, images },
        );

        const result = data.data;
        setState({ result, isAnalyzing: false, analysisError: null });
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setState({ result: null, isAnalyzing: false, analysisError: msg });
        return null;
      }
    },
    [],
  );

  const resetAnalysis = useCallback(() => {
    setState({ result: null, isAnalyzing: false, analysisError: null });
  }, []);

  return { ...state, analyze, resetAnalysis };
}
