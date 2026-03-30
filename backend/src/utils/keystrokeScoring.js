const {
  FEATURE_WEIGHTS,
  NORMAL_RANGES,
  DYSLEXIC_RANGES,
  calculateFeatureRisk,
  calculateCombinedRiskScore
} = require('../../config/keystrokeConfig_Aalto');

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
    wpm: Number(metrics.wpm) || 0,
    errorRate: Number(metrics.errorRate) || 0
  };

  const combined = calculateCombinedRiskScore(safeMetrics, mlAnomalyScore);
  const riskScore = Number(combined.riskScore) || 0;
  const riskLevel = combined.riskLevel || (riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MODERATE' : 'LOW');
  const breakdown = combined.breakdown || {
    holdTimeRisk: 0,
    flightTimeRisk: 0,
    backspaceRisk: 0,
    pauseRisk: 0,
    speedRisk: 0,
    errorRateRisk: 0
  };

  return {
    riskScore,
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
