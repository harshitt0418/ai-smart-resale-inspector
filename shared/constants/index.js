/**
 * shared/constants/index.js
 *
 * Constants shared between frontend and backend.
 * Import from here to keep values in sync across both layers.
 */

// ─── Item categories the YOLO model can detect ──────────────────────────────
const ITEM_CATEGORIES = [
  'smartphone', 'laptop', 'tablet', 'smartwatch',
  'camera', 'headphones', 'tv', 'monitor',
  'refrigerator', 'washing_machine', 'bicycle', 'car_part',
  'furniture', 'book', 'clothing', 'shoes',
];

// ─── Damage types ────────────────────────────────────────────────────────────
const DAMAGE_TYPES = ['scratch', 'dent', 'crack', 'stain', 'unknown'];

// ─── Damage severity levels with multipliers ────────────────────────────────
const DAMAGE_SEVERITY = {
  minor:    { label: 'Minor',    priceImpactFactor: 0.05 },
  moderate: { label: 'Moderate', priceImpactFactor: 0.15 },
  severe:   { label: 'Severe',   priceImpactFactor: 0.30 },
};

// ─── Depreciation rates per year by item category ───────────────────────────
const DEPRECIATION_RATES = {
  smartphone:       0.25,
  laptop:           0.20,
  tablet:           0.20,
  smartwatch:       0.18,
  camera:           0.15,
  headphones:       0.15,
  tv:               0.12,
  monitor:          0.12,
  refrigerator:     0.08,
  washing_machine:  0.08,
  bicycle:          0.10,
  car_part:         0.12,
  furniture:        0.07,
  default:          0.10,
};

// ─── Inspection statuses ─────────────────────────────────────────────────────
const INSPECTION_STATUS = {
  IDLE:      'idle',
  SCANNING:  'scanning',
  DETECTING: 'detecting',
  ANALYZING: 'analyzing',
  COMPLETE:  'complete',
  ERROR:     'error',
};

module.exports = {
  ITEM_CATEGORIES,
  DAMAGE_TYPES,
  DAMAGE_SEVERITY,
  DEPRECIATION_RATES,
  INSPECTION_STATUS,
};
