/**
 * services/damageDetectionService.js
 *
 * Calls the Python ML microservice (fine-tuned YOLOv8) to identify surface
 * damage regions in a captured frame.
 *
 * When the ML service is unreachable the service falls back to a seeded demo
 * so the full UI pipeline is exercisable without Python running.
 */

const axios = require('axios');
const { detectDamageOnnx } = require('./transformersService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS  = parseInt(process.env.ML_TIMEOUT_MS || '10000', 10);

// ─── Demo damage catalogue ─────────────────────────────────────────────────
const DAMAGE_TYPES    = ['scratch', 'dent', 'crack', 'stain', 'unknown'];
const DAMAGE_SEVERITY = ['minor', 'moderate', 'severe'];

/** Deterministic demo based on image tail bytes — same image = same damages. */
function demoDeterministicDamages(imageBase64) {
  const tail = imageBase64.slice(-128);
  let seed = 0;
  for (let i = 0; i < tail.length; i++) seed += tail.charCodeAt(i);

  const count = 1 + (seed % 3); // 1–3 damages

  const damages = [];
  for (let i = 0; i < count; i++) {
    const s      = seed + i * 37;
    const type   = DAMAGE_TYPES[s % DAMAGE_TYPES.length];
    const sevIdx = s % DAMAGE_SEVERITY.length;
    const sev    = DAMAGE_SEVERITY[sevIdx];
    // Confidence is higher for minor, lower for severe (realistic)
    const baseConf = [0.82, 0.74, 0.66][sevIdx];
    const conf   = parseFloat((baseConf + ((s % 5) - 2) * 0.02).toFixed(2));

    damages.push({
      type,
      severity:    sev,
      confidence:  Math.min(0.99, Math.max(0.5, conf)),
      boundingBox: {
        x:      parseFloat((0.05 + (s % 13) * 0.05).toFixed(3)),
        y:      parseFloat((0.05 + (s % 11) * 0.05).toFixed(3)),
        width:  parseFloat((0.10 + (s %  7) * 0.04).toFixed(3)),
        height: parseFloat((0.08 + (s %  9) * 0.04).toFixed(3)),
      },
    });
  }

  return damages;
}

/**
 * Detect surface damage regions in a captured frame.
 *
 * @param {string} imageBase64  Raw base-64 JPEG/PNG (no data-URL prefix).
 * @returns {Promise<Array<{type,severity,confidence,boundingBox}>>}
 */
async function detectDamage(imageBase64) {
  // ── 1. Try Python ML service (fine-tuned YOLOv8 with bounding boxes) ─────
  try {
    const { data } = await axios.post(
      `${ML_SERVICE_URL}/detect/damage`,
      { image: imageBase64 },
      { timeout: ML_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } },
    );
    
    // Return both damages and processed image (if available)
    const damages = (data.damages || []).map((d) => ({ ...d, source: 'ml' }));
    const result = { damages };
    
    // Include processed (bg-removed) image if ML service provided it
    if (data.processedImage) {
      result.processedImage = data.processedImage;
    }
    
    return result;
  } catch (_) { /* Python service offline */ }

  // ── 2. Try Transformers.js CLIP zero-shot (in-process ONNX) ─────────────
  try {
    const damages = await detectDamageOnnx(imageBase64);
    if (damages.length > 0) return { damages };
  } catch (err) {
    console.warn('[DamageDetection] ONNX inference failed:', err.message);
  }

  // ── 3. Demo fallback ─────────────────────────────────────────────────────
  console.warn('[DamageDetection] Using demo fallback');
  return { 
    damages: demoDeterministicDamages(imageBase64).map((d) => ({ ...d, source: 'demo' }))
  };
}

module.exports = { detectDamage };
