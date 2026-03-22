/**
 * routes/report.routes.js — Inspection report endpoints.
 * PDF generation implemented in Part 12.
 */

const router = require('express').Router();
const reportController = require('../controllers/report.controller');

// GET  /api/report/list — list all generated reports
router.get('/list', reportController.list);

// POST /api/report/generate — generate a PDF report for an inspection session
router.post('/generate', reportController.generate);

// GET  /api/report/:id — download a previously generated report
router.get('/:id', reportController.download);

module.exports = router;
