const {
  FEATURE_WEIGHTS,
  NORMAL_RANGES,
  DYSLEXIC_RANGES,
  calculateFeatureRisk,
  calculateCombinedRiskScore
} = require('../../config/keystrokeConfig');

/**
 * Legacy wrapper so existing code can keep calling calculateKeystrokeRisk().
 * Internally delegates to the data-driven helpers defined in keystrokeConfig.
 *
 * @param {Object} metrics - extracted keystroke metrics (cvHoldTime, cvFlightTime, etc.)
 * @param {number} [mlAnomalyScore=0] - Isolation Forest anomaly score
 */
function calculateKeystrokeRisk(metrics = {}, mlAnomalyScore = 0) {
  const safeMetrics = {
    cvHoldTime: Number(metrics.cvHoldTime) || 0,
    cvFlightTime: Number(metrics.cvFlightTime) || 0,
    backspaceRate: Number(metrics.backspaceRate) || 0,
    pauseFrequency: Number(metrics.pauseFrequency) || 0,
    wpm: Number(metrics.wpm) || 0
  };

  const breakdown = {
    holdTimeRisk: calculateFeatureRisk(safeMetrics.cvHoldTime, 'cvHoldTime'),
    flightTimeRisk: calculateFeatureRisk(safeMetrics.cvFlightTime, 'cvFlightTime'),
    backspaceRisk: calculateFeatureRisk(safeMetrics.backspaceRate, 'backspaceRate'),
    pauseRisk: calculateFeatureRisk(safeMetrics.pauseFrequency, 'pauseFrequency'),
    speedRisk: calculateFeatureRisk(safeMetrics.wpm, 'wpm')
  };

  const riskScore = calculateCombinedRiskScore(safeMetrics, mlAnomalyScore);
  const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MODERATE' : 'LOW';

  return {
    riskScore: Math.round(riskScore),
    riskLevel,
    breakdown
  };
}

module.exports = {
  FEATURE_WEIGHTS,
  NORMAL_RANGES,
  DYSLEXIC_RANGES,
  calculateFeatureRisk,
  calculateCombinedRiskScore,
  calculateKeystrokeRisk
};
