/**
 * services/repairCostService.js  — Part 8
 *
 * Estimates repair cost (USD) for detected damage regions.
 * Uses a rule-based look-up table (damage type × severity → cost range).
 * When fine-tuned ML models are available the lookup can be replaced with inference.
 */

// Cost ranges in INR: [min, max]
const DAMAGE_COSTS = {
  crack:   { minor: [1700,  7000],  moderate: [8500,  30000], severe: [30000, 75000] },
  scratch: { minor: [400,   2500],  moderate: [2500,  10000], severe: [10000, 25000] },
  dent:    { minor: [2500,  7500],  moderate: [7500,  21000], severe: [21000, 50000] },
  stain:   { minor: [400,   2000],  moderate: [2000,   7000], severe: [7000,  17000] },
  unknown: { minor: [800,   5000],  moderate: [5000,  15000], severe: [15000, 38000] },
};

/**
 * Estimate repair cost from detected damages.
 *
 * @param {Array<{type, severity}>} damages
 * @returns {{ min: number, max: number, currency: string }}
 */
function estimateRepairCost(damages) {
  if (!damages || damages.length === 0) {
    return { min: 0, max: 0, currency: 'INR' };
  }

  let totalMin = 0;
  let totalMax = 0;

  for (const d of damages) {
    const typeCosts = DAMAGE_COSTS[d.type] ?? DAMAGE_COSTS.unknown;
    const [lo, hi]  = typeCosts[d.severity] ?? typeCosts.minor;
    totalMin += lo;
    totalMax += hi;
  }

  return { min: totalMin, max: totalMax, currency: 'INR' };
}

module.exports = { estimateRepairCost };
