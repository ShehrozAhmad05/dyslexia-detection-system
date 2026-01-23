/**
 * Score Normalization Utilities
 * 
 * Converts raw reading assessment metrics to normalized 0-100 risk scores.
 * Each function maps a metric value to a risk score where:
 * - 0 = No risk (optimal performance)
 * - 100 = High risk (significant reading difficulty)
 * 
 * All thresholds based on ETDD70 dataset analysis and validated against
 * published literature (see backend/config/readingThresholds.js)
 */

const {
  READING_TIME,
  COMPREHENSION,
  REVISIT_COUNT,
  PAUSE_COUNT,
  AVG_PAUSE_DURATION
} = require('../../config/readingThresholds');

// ============================================================================
// NORMALIZATION HELPER FUNCTIONS
// ============================================================================

/**
 * Linear normalization with clamping
 * Maps value from [min, max] range to [0, 100] range
 * 
 * @param {number} value - Raw metric value
 * @param {number} min - Minimum value (maps to 0 risk)
 * @param {number} max - Maximum value (maps to 100 risk)
 * @returns {number} Normalized score 0-100
 */
function linearNormalize(value, min, max) {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Inverse linear normalization (higher value = lower risk)
 * Maps value from [min, max] range to [100, 0] range
 * 
 * @param {number} value - Raw metric value
 * @param {number} min - Minimum value (maps to 100 risk)
 * @param {number} max - Maximum value (maps to 0 risk)
 * @returns {number} Normalized score 0-100
 */
function inverseLinearNormalize(value, min, max) {
  if (value <= min) return 100;
  if (value >= max) return 0;
  return 100 - (((value - min) / (max - min)) * 100);
}

/**
 * Clamp value between min and max
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// READING TIME NORMALIZATION
// ============================================================================

/**
 * Normalize reading time to 0-100 risk score
 * 
 * VALIDATION: HIGH CONFIDENCE ✅
 * - Nerušil et al. (2021): Reading time alone = 95.67% accuracy
 * - ETDD70: Dyslexic 151.8s vs Normal 70.4s (2.16x ratio)
 * 
 * Scoring:
 * - ≤ 70.4s (normal mean) → 0 risk
 * - 111s (threshold) → 50 risk
 * - ≥ 151.8s (dyslexic mean) → 100 risk
 * 
 * @param {number} seconds - Total reading time in seconds
 * @returns {number} Normalized risk score 0-100
 */
function normalizeReadingTime(seconds) {
  // Validate input
  if (seconds == null || isNaN(seconds) || seconds < 0) {
    console.warn('Invalid reading time:', seconds);
    return 50; // Return neutral score for invalid input
  }

  const { normalMean, dyslexicMean } = READING_TIME.reference;
  
  // Linear mapping: 70.4s → 0, 151.8s → 100
  return linearNormalize(seconds, normalMean, dyslexicMean);
}

// ============================================================================
// COMPREHENSION NORMALIZATION
// ============================================================================

/**
 * Normalize comprehension score to 0-100 risk score
 * 
 * VALIDATION: HIGH CONFIDENCE ✅
 * - Standard assessment criterion across dyslexia literature
 * - Inverse scoring: higher comprehension = lower risk
 * 
 * Scoring:
 * - 100% correct → 0 risk
 * - 70% correct → 30 risk
 * - 50% correct → 50 risk
 * - 0% correct → 100 risk
 * 
 * @param {number} percentage - Comprehension score as percentage (0-100)
 * @returns {number} Normalized risk score 0-100
 */
function normalizeComprehension(percentage) {
  // Validate input
  if (percentage == null || isNaN(percentage)) {
    console.warn('Invalid comprehension score:', percentage);
    return 50; // Return neutral score for invalid input
  }

  // Clamp to valid percentage range
  const clampedPercentage = clamp(percentage, 0, 100);
  
  // Inverse mapping: 100% → 0 risk, 0% → 100 risk
  return inverseLinearNormalize(clampedPercentage, 0, 100);
}

// ============================================================================
// REVISIT COUNT NORMALIZATION (Regression Proxy)
// ============================================================================

/**
 * Normalize revisit count to 0-100 risk score
 * 
 * VALIDATION: MODERATE CONFIDENCE ⚠️
 * - Web proxy for eye-tracking regressions
 * - Nilsson Benfatto (2016): 50% of discriminative features = regressions
 * - ETDD70: 1.79x more regressions in dyslexics (31.9 vs 17.9)
 * 
 * Scoring:
 * - 0 revisits → 0 risk
 * - 6 revisits (threshold) → 50 risk
 * - ≥ 12 revisits → 100 risk (2x threshold)
 * 
 * @param {number} count - Number of scroll-back revisit events
 * @returns {number} Normalized risk score 0-100
 */
function normalizeRevisits(count) {
  // Validate input
  if (count == null || isNaN(count) || count < 0) {
    console.warn('Invalid revisit count:', count);
    return 0; // Default to 0 risk if no data
  }

  const { webThreshold } = REVISIT_COUNT.reference;
  const maxRevisits = webThreshold * 2; // 12 revisits = max risk
  
  // Linear mapping: 0 → 0, 6.2 → 50, 12 → 100
  return linearNormalize(count, 0, maxRevisits);
}

// ============================================================================
// PAUSE COUNT NORMALIZATION
// ============================================================================

/**
 * Normalize pause count to 0-100 risk score
 * 
 * VALIDATION: LOW CONFIDENCE ⏳ - EXPERIMENTAL
 * - Novel web metric, no direct literature support
 * - Derived from ETDD70 fixation patterns (1.54x ratio)
 * - Requires pilot validation (Phase 4)
 * 
 * Scoring:
 * - ≤ 5 pauses → 0 risk
 * - 7 pauses (threshold) → 40 risk
 * - ≥ 15 pauses → 100 risk
 * 
 * @param {number} count - Number of inactivity pauses (>3s)
 * @returns {number} Normalized risk score 0-100
 */
function normalizePauses(count) {
  // Validate input
  if (count == null || isNaN(count) || count < 0) {
    console.warn('Invalid pause count:', count);
    return 0; // Default to 0 risk if no data
  }

  const minPauses = 5;  // Typical reader baseline
  const maxPauses = 15; // High difficulty threshold
  
  // Linear mapping: 5 → 0, 15 → 100
  return linearNormalize(count, minPauses, maxPauses);
}

// ============================================================================
// PAUSE DURATION NORMALIZATION
// ============================================================================

/**
 * Normalize average pause duration to 0-100 risk score
 * 
 * VALIDATION: LOW CONFIDENCE ⏳ - EXPERIMENTAL
 * - Based on Nielsen (1993) usability: 3s = hesitation threshold
 * - No dyslexia-specific literature
 * - Requires pilot validation (Phase 4)
 * 
 * Scoring:
 * - ≤ 3000ms → 0 risk (normal processing)
 * - 4000ms → 40 risk
 * - ≥ 6000ms → 100 risk (significant hesitation)
 * 
 * @param {number} milliseconds - Average pause duration in ms
 * @returns {number} Normalized risk score 0-100
 */
function normalizePauseDuration(milliseconds) {
  // Validate input
  if (milliseconds == null || isNaN(milliseconds) || milliseconds < 0) {
    console.warn('Invalid pause duration:', milliseconds);
    return 0; // Default to 0 risk if no data
  }

  const minDuration = 3000;  // 3s - normal hesitation
  const maxDuration = 6000;  // 6s - significant difficulty
  
  // Linear mapping: 3000ms → 0, 6000ms → 100
  return linearNormalize(milliseconds, minDuration, maxDuration);
}

// ============================================================================
// COMBINED RISK SCORE CALCULATION
// ============================================================================

/**
 * Calculate combined risk score from all normalized metrics
 * 
 * Uses weighted sum based on feature importance from ETDD70 analysis
 * and validated against literature (see readingThresholds.js)
 * 
 * @param {Object} metrics - Raw assessment metrics
 * @param {number} metrics.readingTime - Total reading time (seconds)
 * @param {number} metrics.comprehensionScore - Percentage correct (0-100)
 * @param {number} metrics.revisitCount - Number of scroll-backs
 * @param {number} metrics.pauseCount - Number of pauses (>3s)
 * @param {number} metrics.avgPauseDuration - Average pause length (ms)
 * @returns {Object} Risk calculation result
 */
function calculateRiskScore(metrics) {
  const {
    readingTime,
    comprehensionScore,
    revisitCount,
    pauseCount,
    avgPauseDuration
  } = metrics;

  // Normalize each metric to 0-100 scale
  const normalizedScores = {
    readingTime: normalizeReadingTime(readingTime),
    comprehension: normalizeComprehension(comprehensionScore),
    revisitCount: normalizeRevisits(revisitCount),
    pauseCount: normalizePauses(pauseCount),
    avgPauseDuration: normalizePauseDuration(avgPauseDuration)
  };

  // Import weights from configuration
  const {
    FEATURE_WEIGHTS,
    RISK_SCORE_RANGES,
    RISK_LEVELS
  } = require('../../config/readingThresholds');

  // Calculate weighted risk score
  const riskScore = (
    (normalizedScores.readingTime * FEATURE_WEIGHTS.readingTime) +
    (normalizedScores.comprehension * FEATURE_WEIGHTS.comprehension) +
    (normalizedScores.revisitCount * FEATURE_WEIGHTS.revisitCount) +
    (normalizedScores.pauseCount * FEATURE_WEIGHTS.pauseCount) +
    (normalizedScores.avgPauseDuration * FEATURE_WEIGHTS.avgPauseDuration)
  );

  // Clamp final score to 0-100 range
  const finalScore = clamp(Math.round(riskScore), 0, 100);

  // Determine risk level
  let riskLevel, riskLevelData;
  if (finalScore >= RISK_SCORE_RANGES.high) {
    riskLevel = 'HIGH';
    riskLevelData = RISK_LEVELS.HIGH;
  } else if (finalScore >= RISK_SCORE_RANGES.moderate) {
    riskLevel = 'MODERATE';
    riskLevelData = RISK_LEVELS.MODERATE;
  } else {
    riskLevel = 'LOW';
    riskLevelData = RISK_LEVELS.LOW;
  }

  return {
    riskScore: finalScore,
    riskLevel,
    riskLevelData,
    normalizedScores,
    weights: FEATURE_WEIGHTS,
    breakdown: {
      readingTime: {
        raw: readingTime,
        normalized: normalizedScores.readingTime,
        weighted: normalizedScores.readingTime * FEATURE_WEIGHTS.readingTime,
        weight: FEATURE_WEIGHTS.readingTime
      },
      comprehension: {
        raw: comprehensionScore,
        normalized: normalizedScores.comprehension,
        weighted: normalizedScores.comprehension * FEATURE_WEIGHTS.comprehension,
        weight: FEATURE_WEIGHTS.comprehension
      },
      revisitCount: {
        raw: revisitCount,
        normalized: normalizedScores.revisitCount,
        weighted: normalizedScores.revisitCount * FEATURE_WEIGHTS.revisitCount,
        weight: FEATURE_WEIGHTS.revisitCount
      },
      pauseCount: {
        raw: pauseCount,
        normalized: normalizedScores.pauseCount,
        weighted: normalizedScores.pauseCount * FEATURE_WEIGHTS.pauseCount,
        weight: FEATURE_WEIGHTS.pauseCount
      },
      avgPauseDuration: {
        raw: avgPauseDuration,
        normalized: normalizedScores.avgPauseDuration,
        weighted: normalizedScores.avgPauseDuration * FEATURE_WEIGHTS.avgPauseDuration,
        weight: FEATURE_WEIGHTS.avgPauseDuration
      }
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Individual normalizers
  normalizeReadingTime,
  normalizeComprehension,
  normalizeRevisits,
  normalizePauses,
  normalizePauseDuration,
  
  // Combined calculation
  calculateRiskScore,
  
  // Helper utilities (for testing)
  linearNormalize,
  inverseLinearNormalize,
  clamp
};
