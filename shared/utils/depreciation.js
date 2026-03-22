/**
 * shared/utils/depreciation.js
 *
 * Depreciation calculation utility — used by the backend depreciation
 * engine (Part 9) and referenced by the frontend for preview calculations.
 *
 * Formula: currentValue = newPrice × (1 − rate) ^ ageYears
 * Rate is capped so the item never depreciates below 5% of its new value.
 */

const { DEPRECIATION_RATES } = require('../constants');

/**
 * Calculate current value after depreciation.
 *
 * @param {number} newPrice        - Original market price (USD)
 * @param {number} ageYears        - Age of the item in years
 * @param {string} itemCategory    - Item category key from DEPRECIATION_RATES
 * @returns {number}               - Estimated current value (rounded to 2 dp)
 */
function calculateDepreciatedValue(newPrice, ageYears, itemCategory) {
  const rate = DEPRECIATION_RATES[itemCategory] ?? DEPRECIATION_RATES.default;
  const raw  = newPrice * Math.pow(1 - rate, ageYears);
  // Floor at 5% of new price
  const floored = Math.max(raw, newPrice * 0.05);
  return Math.round(floored * 100) / 100;
}

module.exports = { calculateDepreciatedValue };
