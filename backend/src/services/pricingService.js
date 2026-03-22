/**
 * services/pricingService.js  — Parts 9, 10, 11
 *
 * Part 9  — Age Depreciation Engine
 *              currentValue = newPrice × (1 − rate)^ageYears
 *
 * Part 10 — Market Price Estimation
 *              Tries live eBay India prices first (free API, needs EBAY_APP_ID env var).
 *              Falls back to offline reference table when API is unavailable.
 *
 * Part 11 — Final Resale Price Decision
 *              suggestedResalePrice = (currentValue × conditionMultiplier) − midRepairCost
 */

const axios = require('axios');

// ─── Live price cache (in-memory, 1-hour TTL) ────────────────────────────────
const _priceCache   = new Map(); // itemLabel → { price: number, fetchedAt: number }
const CACHE_TTL_MS  = 60 * 60 * 1000; // 1 hour

/**
 * Fetch the current median listing price for an item from eBay India.
 * Requires EBAY_APP_ID environment variable (free at developer.ebay.com).
 *
 * @param {string} itemLabel
 * @returns {Promise<number|null>}  Price in INR, or null on failure.
 */
async function fetchLivePriceFromEbay(itemLabel) {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) return null;

  // Serve from cache if still fresh
  const cached = _priceCache.get(itemLabel);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.price;
  }

  try {
    const { data } = await axios.get(
      'https://svcs.ebay.com/services/search/FindingService/v1',
      {
        params: {
          'OPERATION-NAME':              'findItemsByKeywords',
          'SERVICE-VERSION':             '1.0.0',
          'SECURITY-APPNAME':            appId,
          'RESPONSE-DATA-FORMAT':        'JSON',
          'GLOBAL-ID':                   'EBAY-IN',
          'keywords':                    itemLabel,
          'paginationInput.entriesPerPage': 15,
          'sortOrder':                   'BestMatch',
        },
        timeout: 8000,
      },
    );

    const items = data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item ?? [];
    if (!items.length) return null;

    // Collect valid prices, sort, take median to ignore outliers
    const prices = items
      .map((it) => parseFloat(it?.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ ?? '0'))
      .filter((p) => p > 0)
      .sort((a, b) => a - b);

    if (!prices.length) return null;

    const mid    = Math.floor(prices.length / 2);
    const median = prices.length % 2 !== 0
      ? prices[mid]
      : (prices[mid - 1] + prices[mid]) / 2;

    const price = Math.round(median);
    _priceCache.set(itemLabel, { price, fetchedAt: Date.now() });
    console.log(`[Pricing] eBay live price for "${itemLabel}": ₹${price.toLocaleString('en-IN')}`);
    return price;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 429) {
      console.warn(`[Pricing] eBay free-tier rate limit reached — falling back to offline price table for "${itemLabel}".`);
    } else {
      console.warn(`[Pricing] eBay API error for "${itemLabel}": ${err.message}`);
    }
    return null;
  }
}

// ─── Reference new prices (INR) ───────────────────────────────────────────────
const NEW_PRICES = {
  'Smartphone':      67000,
  'Laptop':         100000,
  'Tablet':          50000,
  'Television':      58000,
  'Headphones':      17000,
  'Computer Mouse':   4000,
  'Keyboard':         8000,
  'TV Remote':        2000,
  'Backpack':         7000,
  'Chair':           21000,
  'Sofa':            58000,
  'Bed':             67000,
  'Clock':            5000,
  'Vase':             4000,
  'Bottle':           2000,
  'Cup':              1500,
  'Book':             1500,
  'Toy':              2500,
  'Luggage':         12000,
  'Umbrella':         2500,
  'Handbag':         17000,
  'Accessories':      4000,
  'Sports Equipment': 10000,
  'Skateboard':       7000,
  'Surfboard':       25000,
  'Tennis Racket':    7000,
  'Microwave':       10000,
  'Oven':            34000,
  'Toaster':          3500,
  'Refrigerator':    58000,
  'Scissors':         1200,
  'Bicycle':         25000,
  'Motorcycle':     250000,
  'Car / Vehicle': 1250000,
  'Food Item':         400,
};

// ─── Annual depreciation rates (0–1) ─────────────────────────────────────────
const DEPRECIATION_RATES = {
  'Smartphone':     0.35,   // high-tech = fast depreciation
  'Laptop':         0.25,
  'Tablet':         0.28,
  'Television':     0.20,
  'Headphones':     0.22,
  'Computer Mouse': 0.18,
  'Keyboard':       0.15,
  'TV Remote':      0.10,
  'Backpack':       0.15,
  'Chair':          0.12,
  'Sofa':           0.12,
  'Bed':            0.10,
  'Clock':          0.08,
  'Vase':           0.05,
  'Bottle':         0.10,
  'Cup':            0.10,
  'Book':           0.05,
  'Toy':            0.20,
  'Luggage':        0.12,
  'Umbrella':       0.10,
  'Handbag':        0.18,
  'Accessories':    0.15,
  'Sports Equipment':0.15,
  'Skateboard':     0.20,
  'Surfboard':      0.15,
  'Tennis Racket':  0.15,
  'Microwave':      0.15,
  'Oven':           0.12,
  'Toaster':        0.12,
  'Refrigerator':   0.10,
  'Scissors':       0.08,
  'Bicycle':        0.15,
  'Motorcycle':     0.18,
  'Car / Vehicle':  0.20,
  'Food Item':      1.00,
};

// ─── Condition multiplier for resale price ────────────────────────────────────
// Fraction of current market value that a buyer will pay at each grade.
const CONDITION_PRICE_MULTIPLIERS = {
  A: 0.72,
  B: 0.55,
  C: 0.38,
  D: 0.22,
};

// ─── Part 10: Market price (depreciation) ─────────────────────────────────────

/**
 * Estimate the current market price of the item based on age.
 * Tries to fetch a live eBay India price first (using exactModel for best results);
 * falls back to offline table keyed by category.
 *
 * @param {string} exactModel       Exact model or category (e.g. 'iPhone 15 Pro' or 'Smartphone')
 * @param {number} ageYears         Item age in years (may be fractional)
 * @param {string} [categoryLabel]  YOLO category used for depreciation rate lookup
 * @returns {Promise<{ newPrice: number, currentPrice: number, currency: string, priceSource: string }>}
 */
async function estimateMarketPrice(exactModel, ageYears, categoryLabel) {
  const category   = categoryLabel || exactModel;
  const tablePrice = NEW_PRICES[category]    ?? NEW_PRICES[exactModel] ?? 300;
  const rate       = DEPRECIATION_RATES[category] ?? DEPRECIATION_RATES[exactModel] ?? 0.20;
  const years      = Math.max(0, ageYears ?? 0);

  // Try live eBay price using the exact model name for accuracy
  const livePrice   = await fetchLivePriceFromEbay(exactModel);
  const newPrice    = (livePrice && livePrice > 0) ? livePrice : tablePrice;
  const priceSource = (livePrice && livePrice > 0) ? 'ebay' : 'table';

  const depreciated  = newPrice * Math.pow(1 - rate, years);
  const currentPrice = Math.max(5, Math.round(depreciated));

  return { newPrice, currentPrice, currency: 'INR', priceSource };
}

// ─── Part 11: Final resale price ──────────────────────────────────────────────

/**
 * Compute the suggested resale price.
 *
 * Formula:
 *   resalePrice = MAX(
 *     (currentMarketPrice × conditionMultiplier) − midRepairCost,
 *     floor (5% of newPrice)     ← minimum floor to avoid negative prices
 *   )
 *
 * @param {{ newPrice, currentPrice }} marketPrice
 * @param {{ min, max }}              repairCost
 * @param {string}                    conditionGrade   'A'|'B'|'C'|'D'
 * @returns {number}  USD
 */
function computeResalePrice(marketPrice, repairCost, conditionGrade) {
  const mult        = CONDITION_PRICE_MULTIPLIERS[conditionGrade] ?? 0.50;
  const midRepair   = (repairCost.min + repairCost.max) / 2;
  const floor       = Math.round(marketPrice.newPrice * 0.05);

  const resale = Math.max(
    floor,
    Math.round(marketPrice.currentPrice * mult - midRepair),
  );

  return resale;
}

module.exports = { estimateMarketPrice, computeResalePrice };
