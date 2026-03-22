/**
 * controllers/report.controller.js  — Part 12
 */

const asyncHandler    = require('../utils/asyncHandler');
const inspectionService = require('../services/inspection.service');
const { generateReport, getReportPath, listReports } = require('../services/reportService');
const path = require('path');

/**
 * POST /api/report/generate
 * Body: { sessionId?, item?, damages?, ... }
 * Re-generates (or generates) a PDF for an inspection result.
 */
const generate = asyncHandler(async (req, res) => {
  const payload = req.body;
  if (!payload) return res.status(400).json({ success: false, message: 'Payload required' });

  const filename = await generateReport(payload);
  return res.json({
    success:   true,
    reportUrl: `/api/report/${encodeURIComponent(filename)}`,
  });
});

/**
 * GET /api/report/:filename
 * Stream the PDF to the client.
 */
const download = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  // Basic path traversal guard
  const safe = path.basename(filename);
  const filepath = getReportPath(safe.replace(/\.pdf$/, ''));

  if (!filepath) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
  const fs = require('fs');
  fs.createReadStream(filepath).pipe(res);
});

/**
 * GET /api/report/list
 * Return all generated reports, newest first.
 */
const list = asyncHandler(async (_req, res) => {
  const reports = listReports();
  return res.json({ success: true, data: reports });
});

module.exports = { generate, download, list };
