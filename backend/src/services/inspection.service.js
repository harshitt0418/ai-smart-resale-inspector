/**
 * services/inspection.service.js
 *
 * Orchestrates the full inspection pipeline.
 * Each step is its own service; this file wires them together.
 */

const { isConnected }   = require('../config/database');
const InspectionSession = require('../models/InspectionSession.model');
const { v4: uuidv4 }    = require('uuid');
const { detectItem }    = require('./itemDetectionService');
const { detectDamage }  = require('./damageDetectionService');
const { analyzeSeverity }    = require('./severityAnalysis');
const { estimateRepairCost } = require('./repairCostService');
const { estimateMarketPrice, computeResalePrice } = require('./pricingService');
const { identifyExactModel } = require('./modelIdentificationService');
const { generateReport } = require('./reportService');

/**
 * Run Parts 7–12 on pre-detected item + damages.
 * Used by the frontend after it has already obtained visual detections.
 *
 * @param {{ item, damages, itemAgeYears }} params
 * @returns {Promise<object>}
 */
async function analyzeFromDetections({ item, damages, itemAgeYears, imageData, imagesData }) {
  const sessionId = uuidv4();
  const age = Math.max(0, parseFloat(itemAgeYears) || 0);

  // ── Part 7: Damage severity ─────────────────────────────────────────────
  const { severityScore, conditionGrade, conditionLabel } = analyzeSeverity(damages);

  // ── Part 8: Repair cost ─────────────────────────────────────────────────
  const repairCost = estimateRepairCost(damages);

  // ── Part 9a: Exact model identification (Gemini Vision) ─────────────────
  // Prefer the multi-photo array; fall back to single image (camera mode).
  const categoryLabel = item?.label ?? 'Unknown';
  const allImages = imagesData?.length ? imagesData
    : imageData                        ? [imageData]
    : [];
  const { exactModel, modelSource } = allImages.length
    ? await identifyExactModel(allImages, categoryLabel)
    : { exactModel: categoryLabel, modelSource: 'category' };

  // ── Parts 9b + 10: Market price with depreciation ───────────────────────
  // Use exact model for eBay search; depreciaton rate still keyed by category.
  const marketPrice = await estimateMarketPrice(exactModel, age, categoryLabel);

  // ── Part 11: Suggested resale price ─────────────────────────────────────
  const suggestedResalePrice = computeResalePrice(marketPrice, repairCost, conditionGrade);

  const analysisResult = {
    sessionId,
    item: { ...item, exactModel, modelSource },
    damages,
    itemAgeYears: age,
    severityScore,
    conditionGrade,
    conditionLabel,
    repairCost,
    marketPrice,
    suggestedResalePrice,
    createdAt: new Date().toISOString(),
  };

  // ── Part 12: PDF report ──────────────────────────────────────────────────
  try {
    const reportFilename = await generateReport(analysisResult);
    analysisResult.reportUrl = `/api/report/${encodeURIComponent(reportFilename)}`;
  } catch (err) {
    console.error('[Report] PDF generation failed:', err.message);
    analysisResult.reportUrl = null;
  }

  return analysisResult;
}

/**
 * Run the complete pipeline starting from a raw image (Parts 5–12).
 * @param {{ image: string, itemAgeYears: number }} params
 */
async function runPipeline({ image, itemAgeYears }) {
  const rawImage = image.replace(/^data:[^;]+;base64,/, '');

  // ── Parts 5 + 6: Detection ──────────────────────────────────────────────
  const item    = await detectItem(rawImage);
  const damages = await detectDamage(rawImage);

  // ── Parts 7-12: Analysis ────────────────────────────────────────────────
  const result = await analyzeFromDetections({ item, damages, itemAgeYears, imageBase64: rawImage });

  // ── Persist if MongoDB is connected ─────────────────────────────────────
  if (isConnected()) {
    try {
      await InspectionSession.create(result);
    } catch (_) { /* non-blocking - continue without persistence */ }
  }

  return result;
}

async function findById(id) {
  if (!isConnected()) {
    const err = new Error('Database is not connected');
    err.status = 503;
    throw err;
  }
  return InspectionSession.findOne({ sessionId: id }).lean();
}

module.exports = { runPipeline, analyzeFromDetections, findById };

