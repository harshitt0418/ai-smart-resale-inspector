/**
 * shared/utils/priceEngine.js
 *
 * Final resale price calculation utility.
 * Takes the depreciated current value, deducts repair costs, and applies
 * a seller-margin factor to produce a suggested resale price.
 */

/**
 * @param {object} params
 * @param {number} params.currentValue     - Depreciated market value
 * @param {number} params.repairCostMid    - Midpoint repair cost estimate
 * @param {number} [params.sellerMargin]   - Fraction to retain as margin (default 0.10)
 * @returns {number} Suggested resale price (rounded to nearest dollar)
 */
function calculateResalePrice({ currentValue, repairCostMid, sellerMargin = 0.10 }) {
  const afterRepair = currentValue - repairCostMid;
  const withMargin  = afterRepair * (1 - sellerMargin);
  // Never suggest below 0
  return Math.max(Math.round(withMargin), 0);
}

module.exports = { calculateResalePrice };
