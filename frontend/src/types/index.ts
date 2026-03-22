/**
 * Shared TypeScript types for the frontend.
 * Keep all domain-level types here so they are importable across all modules.
 */

// ─── Inspection session ──────────────────────────────────────────────────────

export type InspectionStatus =
  | 'idle'
  | 'scanning'
  | 'detecting'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface DetectedItem {
  label: string;
  confidence: number;         // 0–1
  boundingBox: BoundingBox;
  /** Exact brand+model identified by Gemini Vision (e.g. "iPhone 15 Pro") */
  exactModel?:   string;
  /** 'gemini' when identified by vision AI, 'category' when falling back to YOLO label */
  modelSource?:  'gemini' | 'category';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Damage {
  type: 'scratch' | 'dent' | 'crack' | 'stain' | 'unknown';
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number;
  boundingBox: BoundingBox;
  /** Which uploaded photo this damage was detected in (absent for camera captures) */
  photo?: PhotoSlotId;
}

export interface RepairCostEstimate {
  min: number;               // USD
  max: number;               // USD
  currency: string;
}

export interface MarketPriceEstimate {
  newPrice: number;
  currentPrice: number;      // after depreciation
  currency: string;
}

export interface InspectionResult {
  sessionId: string;
  timestamp?: string;
  createdAt?: string;
  item: DetectedItem;
  damages: Damage[];
  itemAgeYears: number;
  /** Part 7 */
  severityScore:  number;      // 0–100
  conditionGrade: 'A' | 'B' | 'C' | 'D';
  conditionLabel: string;      // 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor'
  /** Part 8 */
  repairCost: RepairCostEstimate;
  /** Parts 9–10 */
  marketPrice: MarketPriceEstimate;
  /** Part 11 */
  suggestedResalePrice: number;
  /** Part 12 */
  reportUrl?: string | null;
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Photo upload slots ──────────────────────────────────────────────────────

export type PhotoSlotId = 'front' | 'back' | 'left' | 'right';

export interface PhotoSlot {
  id:          PhotoSlotId;
  label:       string;
  required:    boolean;
  description: string;
}

/** Map of slot → base64 data URL */
export type UploadedPhotos = Partial<Record<PhotoSlotId, string>>;

export type InputMode = 'camera' | 'upload';

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}
