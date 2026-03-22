/**
 * controllers/detection.controller.js
 *
 * Handles HTTP requests for the /api/detect routes.
 * Strips the data-URL prefix from the base-64 payload before passing to services.
 */

const { detectItem }   = require('../services/itemDetectionService');
const { detectDamage } = require('../services/damageDetectionService');

/**
 * POST /api/detect/item
 * Body: { image: string }  — base-64 JPEG/PNG, optionally prefixed with a data URL header.
 */
async function detectItemController(req, res, next) {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain an "image" field (base-64 string).',
      });
    }

    // Strip "data:image/jpeg;base64," prefix if present
    const raw = image.replace(/^data:[^;]+;base64,/, '');

    const result = await detectItem(raw);

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/detect/damage
 * Body: { image: string }  — base-64 JPEG/PNG, optionally prefixed with a data URL header.
 * Returns: { success: true, data: { damages: [], processedImage?: string } }
 */
async function detectDamageController(req, res, next) {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain an "image" field (base-64 string).',
      });
    }

    const raw    = image.replace(/^data:[^;]+;base64,/, '');
    const result = await detectDamage(raw);  // Returns { damages, processedImage? }

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { detectItemController, detectDamageController };
