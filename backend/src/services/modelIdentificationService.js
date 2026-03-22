/**
 * services/modelIdentificationService.js
 *
 * Uses Google Gemini 1.5 Flash (vision) to identify the exact brand + model
 * of a device from a photo.
 *
 * Free tier: 15 RPM / 1,500 requests per day — no credit card required.
 * Get a key at: https://aistudio.google.com/app/apikey
 *
 * Returns the exact model string (e.g. "iPhone 15 Pro", "Samsung Galaxy S24 Ultra")
 * or falls back to the YOLO category label if identification fails.
 */

const axios = require('axios');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// In-memory cache: base64 tail → identified model (avoids re-calling for same image)
const _modelCache   = new Map();
const CACHE_TTL_MS  = 30 * 60 * 1000; // 30 minutes

/**
 * Identify the exact brand and model of a device from one or more images.
 * Each image is passed as { base64, mimeType } to preserve the correct format.
 *
 * @param {{ base64: string, mimeType: string }[]} images
 * @param {string} categoryLabel  YOLO category fallback (e.g. "Smartphone")
 * @returns {Promise<{ exactModel: string, modelSource: 'gemini'|'category' }>}
 */
async function identifyExactModel(images, categoryLabel) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !images?.length) {
    return { exactModel: categoryLabel, modelSource: 'category' };
  }

  // Cache key: combine tail bytes of all images
  const cacheKey = images.map((img) => img.base64.slice(-64)).join('|');
  const cached   = _modelCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { exactModel: cached.exactModel, modelSource: 'gemini' };
  }

  const photoCount = images.length;
  const prompt = [
    `You are an expert electronics and product appraiser with encyclopedic knowledge of brands and models.`,
    `You are given ${photoCount} photo${photoCount > 1 ? 's' : ''} of a ${categoryLabel}.`,
    ``,
    `TASK: Identify the most specific brand and model you can determine.`,
    ``,
    `INSTRUCTIONS:`,
    `- Examine ALL visual clues: brand logos, printed text, label stickers, color/finish,`,
    `  port types, button placement, screen shape, camera configuration, overall design.`,
    `- Always try to be MORE specific than just "${categoryLabel}".`,
    `- Certainty levels (use whichever you can confirm):`,
    `  Exact model  → "Samsung Galaxy S24 Ultra"`,
    `  Series       → "Samsung Galaxy S-series" or "iPhone 14/15 series"`,
    `  Brand only   → "Samsung Smartphone" or "Apple iPhone"`,
    `- If TRULY unidentifiable (completely blank/covered/generic), reply: "${categoryLabel}"`,
    ``,
    `Reply with ONLY the identification string — no explanation, no punctuation around it.`,
  ].join('\n');

  // Build parts: text prompt + one inlineData per image with correct mimeType
  const parts = [
    { text: prompt },
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    })),
  ];

  try {
    const { data } = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{ parts }],
        generationConfig: {
          temperature:     0.2,
          maxOutputTokens: 60,
        },
      },
      { timeout: 15000 },
    );

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const exactModel = raw.replace(/["'\n]/g, '').trim() || categoryLabel;

    _modelCache.set(cacheKey, { exactModel, fetchedAt: Date.now() });
    console.log(`[ModelID] Identified from ${photoCount} photo(s): "${exactModel}" (was: "${categoryLabel}")`);

    return { exactModel, modelSource: exactModel === categoryLabel ? 'category' : 'gemini' };
  } catch (err) {
    const status = err?.response?.status;
    if (status === 429) {
      console.warn('[ModelID] Gemini free-tier rate limit reached — falling back to YOLO category label.');
    } else {
      console.warn(`[ModelID] Gemini API error (${status ?? 'network'}): ${err.message}`);
      if (err?.response?.data) {
        console.warn('[ModelID] Gemini response:', JSON.stringify(err.response.data));
      }
    }
    return { exactModel: categoryLabel, modelSource: 'category' };
  }
}

module.exports = { identifyExactModel };
