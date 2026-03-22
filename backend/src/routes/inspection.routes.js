/**
 * routes/inspection.routes.js
 */

const router = require('express').Router();
const inspectionController = require('../controllers/inspection.controller');

// POST /api/inspection/analyze         — full pipeline (image → everything)
router.post('/analyze', inspectionController.analyze);

// POST /api/inspection/analyze-result  — Parts 7-12 on pre-detected data
router.post('/analyze-result', inspectionController.analyzeFromDetections);

// GET  /api/inspection/:id             — retrieve a saved session
router.get('/:id', inspectionController.getById);

module.exports = router;

