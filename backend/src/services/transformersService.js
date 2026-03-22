/**
 * services/transformersService.js
 *
 * In-process ML inference using @xenova/transformers (ONNX Runtime under the hood).
 * NO Python required — models are auto-downloaded from Hugging Face on first use
 * and then cached locally.
 *
 *  • Item detection  — Xenova/yolos-tiny  (~24 MB quantized, COCO 91 classes)
 *  • Damage scoring  — Xenova/clip-vit-base-patch32 (~75 MB quantized, zero-shot)
 *
 * First call per model will download weights; subsequent calls use the cache.
 * Cache path: ml-models/weights/transformers-cache/
 */

const path  = require('path');
const sharp = require('sharp');

// ─── Cache dir ────────────────────────────────────────────────────────────────
const CACHE_DIR = path.join(
  __dirname, '..', '..', '..', 'ml-models', 'weights', 'transformers-cache',
);

let _RawImage = null; // cached after first import

/** Lazily import @xenova/transformers and cache the RawImage class. */
async function _getTransformers() {
  if (!_RawImage) {
    const mod = await import('@xenova/transformers');
    mod.env.cacheDir        = CACHE_DIR;
    mod.env.allowLocalModels = false;
    _RawImage = mod.RawImage;
  }
  return _RawImage;
}

/**
 * Convert a base64 image string to a RawImage (RGBA, original resolution).
 * Passes pixel data directly — no URL fetching or temp files required.
 */
async function _toRawImage(base64Image) {
  const RawImage    = await _getTransformers();
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()   // → 4 channels (RGBA)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new RawImage(new Uint8ClampedArray(data), info.width, info.height, 4);
}

/**
 * Crop an image buffer to a region and return a RawImage.
 */
async function _cropToRawImage(imageBuffer, region) {
  const RawImage = await _getTransformers();
  const { data, info } = await sharp(imageBuffer)
    .extract(region)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new RawImage(new Uint8ClampedArray(data), info.width, info.height, 4);
}

// ─── Model singletons ─────────────────────────────────────────────────────────
let _detectorPromise = null;
let _clipPromise     = null;

async function _getDetector() {
  if (!_detectorPromise) {
    _detectorPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      env.cacheDir        = CACHE_DIR;
      env.allowLocalModels = false;
      console.log('[Transformers] Loading object-detection model (first run ~160 MB)…');
      const det = await pipeline('object-detection', 'Xenova/detr-resnet-50', { quantized: true });
      console.log('[Transformers] Object-detection model ready (DETR ResNet-50, mAP 42.0)');
      return det;
    })();
  }
  return _detectorPromise;
}

async function _getClip() {
  if (!_clipPromise) {
    _clipPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      env.cacheDir        = CACHE_DIR;
      env.allowLocalModels = false;
      console.log('[Transformers] Loading CLIP model (first run ~75 MB)…');
      const clf = await pipeline(
        'zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', { quantized: true },
      );
      console.log('[Transformers] CLIP model ready');
      return clf;
    })();
  }
  return _clipPromise;
}

// ─── COCO class → resale item label ──────────────────────────────────────────
const COCO_TO_RESALE = {
  // Electronics
  'cell phone':    'Smartphone',
  'laptop':        'Laptop',
  'keyboard':      'Keyboard',
  'tv':            'Television',
  'mouse':         'Computer Mouse',
  'remote':        'TV Remote',
  // Furniture
  'chair':         'Chair',
  'couch':         'Sofa',
  'bed':           'Bed',
  'dining table':  'Dining Table',
  'bench':         'Bench',
  // Bags & accessories
  'backpack':      'Backpack',
  'suitcase':      'Luggage',
  'umbrella':      'Umbrella',
  'handbag':       'Handbag',
  'tie':           'Accessories',
  // Sports
  'sports ball':   'Sports Equipment',
  'baseball bat':  'Sports Equipment',
  'baseball glove':'Sports Equipment',
  'skateboard':    'Skateboard',
  'surfboard':     'Surfboard',
  'tennis racket': 'Tennis Racket',
  'skis':          'Ski Equipment',
  'snowboard':     'Snowboard',
  'frisbee':       'Sports Equipment',
  // Kitchen & home
  'microwave':     'Microwave',
  'oven':          'Oven',
  'toaster':       'Toaster',
  'refrigerator':  'Refrigerator',
  'wine glass':    'Glassware',
  'bottle':        'Bottle',
  'cup':           'Cup',
  'bowl':          'Kitchenware',
  // Transport
  'bicycle':       'Bicycle',
  'motorcycle':    'Motorcycle',
  'car':           'Vehicle',
  'boat':          'Boat',
  // Misc
  'book':          'Book',
  'clock':         'Clock',
  'vase':          'Vase',
  'scissors':      'Scissors',
  'teddy bear':    'Toy',
  'hair drier':    'Hair Dryer',
  'toothbrush':    'Personal Care Item',
  'pizza':         'Food Item',
  'cake':          'Food Item',
};

// ─── Damage CLIP labels — prompt ensembling ─────────────────────────────────
//
// Using 3 varied prompts per damage class and averaging CLIP scores is a
// well-established technique ("prompt ensembling") that significantly improves
// zero-shot classification accuracy over a single prompt.
//
const DAMAGE_PROMPT_SETS = {
  crack: [
    'a device with a cracked or broken screen',
    'a visible fracture or split in the surface material',
    'shattered glass or cracked plastic casing',
  ],
  scratch: [
    'scratches or scuff marks clearly visible on the body',
    'fine linear abrasion marks on the device surface',
    'a scratched or heavily worn casing',
  ],
  dent: [
    'a dented or physically deformed body panel',
    'impact damage causing a visible dent in the casing',
    'bent or crushed frame or corner of a device',
  ],
  stain: [
    'surface stains, heavy dirt, or discolouration on an item',
    'liquid damage marks or water stains on a device',
    'yellowed, oxidised, or badly soiled material',
  ],
  clean: [
    'a clean item in perfect undamaged condition',
    'no visible damage, scratches, or defects on the surface',
    'a well-maintained device with a flawless appearance',
  ],
};

// All 15 prompts flattened — passed to CLIP in a single forward pass
const ALL_DAMAGE_CANDIDATES = Object.values(DAMAGE_PROMPT_SETS).flat();

// Maps aggregated class name → damage output info
const DAMAGE_CLASS_INFO = {
  crack:   { type: 'crack',   baseSeverity: 'severe'   },
  scratch: { type: 'scratch', baseSeverity: 'moderate' },
  dent:    { type: 'dent',    baseSeverity: 'moderate' },
  stain:   { type: 'stain',   baseSeverity: 'minor'    },
  clean:   null,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect the primary resale item using YOLOS-tiny COCO detection.
 * @param {string} base64Image  Raw base-64 JPEG/PNG (no data-URL prefix).
 * @returns {Promise<object|null>}
 */
async function detectItemOnnx(base64Image) {
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const { width, height } = await sharp(imageBuffer).metadata();

  const rawImage = await _toRawImage(base64Image);
  const detector = await _getDetector();
  const results  = await detector(rawImage, { threshold: 0.20 });

  let best = null;
  for (const r of results) {
    const label  = r.label.toLowerCase();
    const mapped = COCO_TO_RESALE[label];
    if (mapped && (!best || r.score > best.score)) {
      best = { label: mapped, score: r.score, box: r.box };
    }
  }

  if (!best) {
    // No resale item found — return the highest-confidence detection anyway
    if (results.length > 0) {
      const top = results.sort((a, b) => b.score - a.score)[0];
      best = {
        label: top.label.charAt(0).toUpperCase() + top.label.slice(1),
        score: top.score,
        box:   top.box,
      };
    } else {
      return null;
    }
  }

  return {
    label:       best.label,
    confidence:  parseFloat(best.score.toFixed(3)),
    boundingBox: {
      x:      parseFloat((best.box.xmin / width).toFixed(4)),
      y:      parseFloat((best.box.ymin / height).toFixed(4)),
      width:  parseFloat(((best.box.xmax - best.box.xmin) / width).toFixed(4)),
      height: parseFloat(((best.box.ymax - best.box.ymin) / height).toFixed(4)),
    },
    source: 'onnx',
  };
}

/**
 * Detect damage using CLIP zero-shot classification with prompt ensembling.
 *
 * For each image region we run CLIP against ALL 15 prompts (3 per class) in a
 * single forward pass.  Scores are averaged across the 3 prompts of each class
 * to get a robust per-class signal.  Damage is reported only when the top
 * damage class clearly outscores the "clean" baseline (margin threshold).
 * Severity is derived from the margin rather than being hard-coded per type.
 *
 * @param {string} base64Image  Raw base-64 JPEG/PNG (no data-URL prefix).
 * @returns {Promise<Array>}
 */
async function detectDamageOnnx(base64Image) {
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const { width, height } = await sharp(imageBuffer).metadata();
  const classifier = await _getClip();

  /**
   * Run CLIP on a RawImage, return per-class averaged scores.
   * @param {object} rawImg
   * @returns {Promise<Record<string, number>>} e.g. { crack: 0.22, scratch: 0.18, … }
   */
  async function runEnsemble(rawImg) {
    const results      = await classifier(rawImg, { candidate_labels: ALL_DAMAGE_CANDIDATES });
    const scoreByLabel = Object.fromEntries(results.map(r => [r.label, r.score]));
    return Object.fromEntries(
      Object.entries(DAMAGE_PROMPT_SETS).map(([cls, prompts]) => [
        cls,
        prompts.reduce((s, p) => s + (scoreByLabel[p] ?? 0), 0) / prompts.length,
      ]),
    );
  }

  const damages = [];

  // ── Analyse 4 quadrant crops to localise damage ───────────────────────────
  const halfW = Math.floor(width  / 2);
  const halfH = Math.floor(height / 2);
  const quadrants = [
    { left: 0,     top: 0,     width: halfW, height: halfH },
    { left: halfW, top: 0,     width: halfW, height: halfH },
    { left: 0,     top: halfH, width: halfW, height: halfH },
    { left: halfW, top: halfH, width: halfW, height: halfH },
  ];

  for (const quad of quadrants) {
    const rawImg     = await _cropToRawImage(imageBuffer, quad);
    const classScores = await runEnsemble(rawImg);
    const cleanScore  = classScores.clean;

    // Top damage class (ignoring 'clean')
    const [topCls, topScore] = Object.entries(classScores)
      .filter(([c]) => c !== 'clean')
      .sort(([, a], [, b]) => b - a)[0];

    const dmgInfo = DAMAGE_CLASS_INFO[topCls];
    const margin  = topScore - cleanScore;

    // Only report damage when it clearly outscores the clean baseline.
    // Severity is derived from the margin: larger margin = more confident damage.
    if (dmgInfo && margin > 0.04) {
      const severity = margin > 0.12 ? 'severe' : margin > 0.06 ? 'moderate' : 'minor';
      damages.push({
        type:       dmgInfo.type,
        severity,
        confidence: parseFloat(topScore.toFixed(3)),
        boundingBox: {
          x:      parseFloat((quad.left / width).toFixed(4)),
          y:      parseFloat((quad.top  / height).toFixed(4)),
          width:  parseFloat((quad.width  / width).toFixed(4)),
          height: parseFloat((quad.height / height).toFixed(4)),
        },
        source: 'onnx',
      });
    }
  }

  // ── Fallback: full-image ensemble if no quadrant damage found ─────────────
  if (damages.length === 0) {
    const fullRaw    = await _toRawImage(base64Image);
    const classScores = await runEnsemble(fullRaw);
    const cleanScore  = classScores.clean;

    const [topCls, topScore] = Object.entries(classScores)
      .filter(([c]) => c !== 'clean')
      .sort(([, a], [, b]) => b - a)[0];

    const dmgInfo = DAMAGE_CLASS_INFO[topCls];
    const margin  = topScore - cleanScore;

    if (dmgInfo && margin > 0.03) {
      const severity = margin > 0.12 ? 'severe' : margin > 0.06 ? 'moderate' : 'minor';
      damages.push({
        type:       dmgInfo.type,
        severity,
        confidence: parseFloat(topScore.toFixed(3)),
        boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        source:     'onnx',
      });
    }
  }

  return damages;
}

module.exports = { detectItemOnnx, detectDamageOnnx };
