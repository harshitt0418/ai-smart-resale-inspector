/**
 * services/itemDetectionService.js
 *
 * Calls the Python ML microservice (YOLOv8) to identify the primary item
 * in a captured frame.
 *
 * When the ML service is unreachable the service falls back to a deterministic
 * demo response so the full UI pipeline is exercisable without Python running.
 */

const axios = require('axios');
const { detectItemOnnx } = require('./transformersService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS  = parseInt(process.env.ML_TIMEOUT_MS || '10000', 10);

// ─── Demo fallback catalogue ──────────────────────────────────────────────────
// Common resale items with realistic YOLO-style confidence scores.
const DEMO_ITEMS = [
  { label: 'Smartphone',     confidence: 0.94 },
  { label: 'Laptop',         confidence: 0.91 },
  { label: 'Tablet',         confidence: 0.89 },
  { label: 'Headphones',     confidence: 0.87 },
  { label: 'Camera',         confidence: 0.85 },
  { label: 'Keyboard',       confidence: 0.90 },
  { label: 'Computer Mouse', confidence: 0.88 },
  { label: 'Television',     confidence: 0.93 },
  { label: 'Backpack',       confidence: 0.86 },
  { label: 'Chair',          confidence: 0.92 },
  { label: 'Wristwatch',     confidence: 0.83 },
  { label: 'Sneakers',       confidence: 0.88 },
];

/**
 * Derive a deterministic item from the tail bytes of the base-64 string.
 * Same image → same detection (stable across re-renders).
 * @param {string} imageBase64
 */
function demoDeterministicItem(imageBase64) {
  const tail = imageBase64.slice(-64);
  let sum = 0;
  for (let i = 0; i < tail.length; i++) sum += tail.charCodeAt(i);

  const entry   = DEMO_ITEMS[sum % DEMO_ITEMS.length];
  const noiseX  = (sum % 7) * 0.02;
  const noiseY  = (sum % 5) * 0.02;
  const conf    = Math.min(0.99, entry.confidence + ((sum % 3) - 1) * 0.01);

  return {
    label:       entry.label,
    confidence:  parseFloat(conf.toFixed(2)),
    // Normalised bounding box (0–1 relative to image dimensions)
    boundingBox: {
      x:      parseFloat((0.15 + noiseX).toFixed(3)),
      y:      parseFloat((0.10 + noiseY).toFixed(3)),
      width:  0.65,
      height: 0.75,
    },
    source: 'demo',
  };
}

/**
 * Detect the primary resale item in a captured frame.
 *
 * @param {string} imageBase64  Raw base-64 encoded JPEG/PNG (no data-URL prefix).
 * @returns {Promise<{label:string, confidence:number, boundingBox:object, source:string}>}
 */
async function detectItem(imageBase64) {
  // ── 1. Try Python ML service (highest accuracy — YOLOv8 full) ────────────
  try {
    const { data } = await axios.post(
      `${ML_SERVICE_URL}/detect/item`,
      { image: imageBase64 },
      { timeout: ML_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } },
    );
    return { ...data, source: 'ml' };
  } catch (_) { /* Python service offline */ }

  // ── 2. Try Transformers.js ONNX (in-process, no Python needed) ──────────
  try {
    const result = await detectItemOnnx(imageBase64);
    if (result) return result;
  } catch (err) {
    console.warn('[ItemDetection] ONNX inference failed:', err.message);
  }

  // ── 3. Demo fallback (hash-based, no inference) ──────────────────────────
  console.warn('[ItemDetection] Using demo fallback');
  return demoDeterministicItem(imageBase64);
}

module.exports = { detectItem };
