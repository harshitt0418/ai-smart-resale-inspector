/**
 * controllers/inspection.controller.js
 */

const inspectionService = require('../services/inspection.service');
const asyncHandler      = require('../utils/asyncHandler');

/** POST /api/inspection/analyze  — full pipeline from raw image */
const analyze = asyncHandler(async (req, res) => {
  const { image, itemAgeYears = 0 } = req.body;
  if (!image) return res.status(400).json({ success: false, message: 'image is required' });
  const result = await inspectionService.runPipeline({ image, itemAgeYears });
  return res.json({ success: true, data: result });
});

/**
 * POST /api/inspection/analyze-result
 * Body: { item, damages, itemAgeYears }
 * Takes pre-detected item + damages and runs Parts 7–12.
 */
const analyzeFromDetections = asyncHandler(async (req, res) => {
  const { item, damages, itemAgeYears = 0, image, images } = req.body;
  if (!item) return res.status(400).json({ success: false, message: 'item is required' });

  // Strip data-URL prefix but also capture the mime type for each image.
  // Passing the correct mime type is critical for Gemini to parse non-JPEG images.
  const parseImage = (dataUrl) => {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return {
      base64:   dataUrl.replace(/^data:[^;]+;base64,/, ''),
      mimeType: match ? match[1] : 'image/jpeg',
    };
  };

  const imageData  = image  ? parseImage(image)  : undefined;
  const imagesData = Array.isArray(images) && images.length
    ? images.map(parseImage)
    : undefined;

  const result = await inspectionService.analyzeFromDetections({
    item,
    damages:     damages ?? [],
    itemAgeYears,
    imageData,
    imagesData,
  });
  return res.json({ success: true, data: result });
});

/** GET /api/inspection/:id */
const getById = asyncHandler(async (req, res) => {
  const session = await inspectionService.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  return res.json({ success: true, data: session });
});

module.exports = { analyze, analyzeFromDetections, getById };

