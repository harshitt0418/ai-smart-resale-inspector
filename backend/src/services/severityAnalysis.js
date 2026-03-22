/**
 * services/severityAnalysis.js  — Part 7
 *
 * Converts the raw `damages` array into:
 *   - severityScore   0–100  (0 = pristine, 100 = destroyed)
 *   - conditionGrade  A / B / C / D
 *   - conditionLabel  Excellent / Very Good / Good / Fair / Poor
 */

// Weight each severity level (minor=1, moderate=3, severe=6)
const SEVERITY_WEIGHTS = { minor: 1, moderate: 3, severe: 6 };

// Additional multiplier per damage type (cracks are most value-destructive)
const TYPE_MULTIPLIERS = {
  crack:   1.5,
  dent:    1.2,
  scratch: 0.8,
  stain:   0.6,
  unknown: 1.0,
};

/**
 * Analyse detected damages and return a structured severity report.
 *
 * @param {Array<{type, severity, confidence}>} damages
 * @returns {{ severityScore: number, conditionGrade: string, conditionLabel: string }}
 */
function analyzeSeverity(damages) {
  if (!damages || damages.length === 0) {
    return { severityScore: 0, conditionGrade: 'A', conditionLabel: 'Excellent' };
  }

  // Accumulate weighted damage score
  let rawScore = 0;
  for (const d of damages) {
    const sW = SEVERITY_WEIGHTS[d.severity] ?? 1;
    const tW = TYPE_MULTIPLIERS[d.type]     ?? 1.0;
    const conf = Math.min(1, Math.max(0, d.confidence ?? 1));
    rawScore += sW * tW * conf;
  }

  // Normalise to 0–100 with a soft cap
  // Max theoretical score per damage item ≈ 6 × 1.5 × 1 = 9
  const maxExpected = damages.length * 9;
  const severityScore = Math.min(100, Math.round((rawScore / maxExpected) * 100));

  let conditionGrade, conditionLabel;
  if      (severityScore === 0) { conditionGrade = 'A'; conditionLabel = 'Excellent'; }
  else if (severityScore <= 20) { conditionGrade = 'A'; conditionLabel = 'Very Good'; }
  else if (severityScore <= 40) { conditionGrade = 'B'; conditionLabel = 'Good';      }
  else if (severityScore <= 65) { conditionGrade = 'C'; conditionLabel = 'Fair';      }
  else                          { conditionGrade = 'D'; conditionLabel = 'Poor';      }

  return { severityScore, conditionGrade, conditionLabel };
}

module.exports = { analyzeSeverity };
