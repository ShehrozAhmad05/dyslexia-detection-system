/**
 * KEYSTROKE SCORING CONFIGURATION
 * Derived from Aalto 136M Keystrokes Dataset (SENTENCE TYPING)
 *
 * METHODOLOGY:
 *   1. Normal ranges  : empirically derived from Aalto Dataset (n=141700 sessions)
 *   2. Risk thresholds: statistical outlier detection (95th / 5th percentile)
 *   3. Feature weights: based on discriminative power in typing-disorder research
 *
 * DATA SOURCE  : Aalto University 136M Keystrokes Dataset (Dhakal et al., 2018)
 * TASK         : Sentence transcription (NOT password typing)
 * ANALYSIS DATE: March 2026
 *
 * CITATION:
 *   Dhakal, V., Feit, A., Kristensson, P. O., & Oulasvirta, A. (2018).
 *   Observations on Typing from 136 Million Keystrokes.
 *   CHI 2018 (Best Paper Award). https://doi.org/10.1145/3173574.3174220
 */

// =============================================================
// FEATURE WEIGHTS (relative importance in dyslexia detection)
// =============================================================
const FEATURE_WEIGHTS = {
  holdTimeVariability:   0.26,
  flightTimeVariability: 0.21,
  backspaceRate:         0.21, //20
  pauseFrequency:        0.12, //10
  overallSpeed:          0.08, //13
  errorRate:             0.12, //10
};

// =============================================================
// NORMAL RANGES  (Aalto sentence-typing population)
// =============================================================
const NORMAL_RANGES = {
  avgHoldTime: {
    mean: 109.40,
    std:  25.03,
    min:  74.45,
    max:  151.72,
    unit: 'ms',
  },

  cvHoldTime: {
    mean:      26.57,
    max:       37.88,
    threshold: 29.31,
    unit:      '%',
  },

  avgFlightTime: {
    mean: 170.66,
    std:  100.38,
    min:  55.65,
    max:  364.70,
    unit: 'ms',
  },

  cvFlightTime: {
    mean:      120.11,
    max:       180.87,
    threshold: 138.26,
    unit:      '%',
  },

  wpm: {
    mean: 52.75,
    std:  26.29,
    min:  18.81,
    max:  102.85,
    unit: 'words/min',
  },

  pauseFrequency: {
    mean: 0.0226,
    p95:  0.1667,
    unit: 'pauses/word',
    note: 'Normalized: pauses(>2 s) per word typed',
  },

  pauseDuration: {
    mean: 363.05,
    p95:  2741.01,
    unit: 'ms',
    note: 'Average duration of pauses >2 s',
  },

  backspaceRate: {
    mean:      0.0415,
    max:       0.1481,
    excellent: 0.0000,
    unit:      'ratio',
    source:    'Aalto 136M Keystrokes (BKSP/DEL keypresses)',
  },
};

// =============================================================
// DYSLEXIC RANGES  (statistical outlier thresholds)
// =============================================================
const DYSLEXIC_RANGES = {
  avgHoldTime: {
    min:           151.72,
    threshold:     159.45,
    unit:          'ms',
    justification: 'Beyond 95th percentile of normal sentence typing',
  },

  cvHoldTime: {
    min:           37.88,
    threshold:     50.24,
    unit:          '%',
    justification: 'Severe motor inconsistency',
  },

  avgFlightTime: {
    min:           364.70,
    threshold:     371.41,
    unit:          'ms',
    justification: 'Processing delays beyond normal range',
  },

  cvFlightTime: {
    min:           180.87,
    threshold:     187.19,
    unit:          '%',
    justification: 'Extreme rhythm variability',
  },

  wpm: {
    max:           24.00,
    threshold:     10.00,
    unit:          'words/min',
    justification: 'Speed below 25th percentile signals processing difficulty',
  },

  pauseFrequency: {
    min:           0.1667,
    threshold:     0.1840,
    unit:          'pauses/word',
    justification: 'Excessive hesitation (per-word, sentence-length neutral)',
  },

  pauseDuration: {
    min:           2741.01,
    threshold:     2842.21,
    unit:          'ms',
    justification: 'Long pauses indicate high cognitive load',
  },

  backspaceRate: {
    min:           0.1481,
    threshold:     0.1481,
    unit:          'ratio',
    justification: 'Frequent BKSP/DEL use beyond 95th percentile',
  },
};

// =============================================================
// METADATA
// =============================================================
const METADATA = {
  dataSource:   'Aalto 136M Keystrokes Dataset (sentence typing)',
  subjects:     168000,
  sessions:     141700,
  analysisDate: 'March 2026',
  version:      '4.0-aalto-derived',
  mlScoreCalibration: {
    minScore: -0.548387,
    maxScore: -0.359896,
    source: 'percentile',
  },

  primaryCitations: [
    'Dhakal et al. (2018) - Observations on Typing from 136M Keystrokes (CHI Best Paper)',
    'Chandola et al. (2009) - Anomaly Detection: A Survey',
  ],

  advantages: [
    'Real sentence typing data (not passwords)',
    'Large sample size (141700 sessions)',
    'Matches actual user input context for dyslexia screening',
    'No domain transfer assumptions needed',
    'ALL features directly measured including backspace rate via BKSP/DEL keys',
  ],

  limitations: [
    'No dyslexic subjects in training data',
    'Thresholds based on statistical outlier detection',
    'Not clinically validated - screening tool only',
    'Requires validation with labelled dyslexic keystroke data',
  ],

  futureWork: [
    'Collect labelled dyslexic keystroke dataset',
    'Clinical validation study',
    'Cross-validation with established dyslexia assessments',
    'Age-specific threshold calibration',
  ],
};

// =============================================================
// TEST PROMPTS  (used by /api/keystroke/start)
// =============================================================
const TEST_PROMPTS = [
  'The quick brown fox jumps over the lazy dog near the riverbank.',
  'Reading and writing skills develop through consistent practice and patience.',
  'Children learn best when given encouragement and proper guidance.',
  'Technology helps students access information quickly and efficiently.',
  'Every student deserves the opportunity to reach their full potential.',
];

// =============================================================
// SCORING FUNCTIONS
// =============================================================

/**
 * Map a single feature value to a 0-100 risk score.
 * Returns 0 when value is within normal range, 100 when at/above dyslexic threshold.
 */
function calculateFeatureRisk(value, normalRange, dyslexicRange) {
  const normMax = normalRange.max  ?? Infinity;
  const normMin = normalRange.min  ?? -Infinity;
  const dyslMin = dyslexicRange?.min       ?? normMax;
  const dyslThr = dyslexicRange?.threshold ?? dyslMin;

  if (value >= normMin && value <= normMax) return 0;
  if (value >= dyslThr) return 100;

  const range = dyslThr - normMax;
  if (range <= 0) return value > normMax ? 100 : 0;
  return Math.min(100, Math.max(0, ((value - normMax) / range) * 100));
}

/**
 * Risk for features where lower values are worse (e.g., WPM).
 */
function calculateLowerIsWorseRisk(value, normalMin, dyslexicThreshold) {
  if (value >= normalMin) return 0;
  if (value <= dyslexicThreshold) return 100;

  const span = normalMin - dyslexicThreshold;
  if (span <= 0) return value < normalMin ? 100 : 0;
  return Math.min(100, Math.max(0, ((normalMin - value) / span) * 100));
}

/**
 * Percentile-based normalization of Isolation Forest score to 0-100 risk.
 * lower score => more anomalous => higher risk.
 */
function normalizeMlScore(mlScore, calibration = METADATA.mlScoreCalibration || {}) {
  const minScore = Number(calibration.minScore);
  const maxScore = Number(calibration.maxScore);

  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore) || maxScore <= minScore) {
    return 0;
  }

  const normalized = ((maxScore - mlScore) / (maxScore - minScore)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Heuristic mapping from text error rate (%) to risk (0-100).
 * This is intentionally conservative until dataset-level calibration is available.
 */
function calculateErrorRateRisk(errorRatePercent) {
  const value = Number(errorRatePercent);
  if (!Number.isFinite(value) || value <= 0) return 0;

  const normalMax = 5;
  const dyslexicThreshold = 35;

  if (value <= normalMax) return 0;
  if (value >= dyslexicThreshold) return 100;

  const span = dyslexicThreshold - normalMax;
  return Math.min(100, Math.max(0, ((value - normalMax) / span) * 100));
}

/**
 * Combine rule-based feature risks with optional ML anomaly score.
 * Fusion: 60% rule-based + 40% ML  (Aalto revision, March 2026).
 */
function calculateCombinedRiskScore(metrics, mlScore = null) {
  const { cvHoldTime, cvFlightTime, backspaceRate, pauseFrequency, wpm, errorRate } = metrics;

  const holdTimeRisk   = calculateFeatureRisk(cvHoldTime,          NORMAL_RANGES.cvHoldTime,   DYSLEXIC_RANGES.cvHoldTime);
  const flightTimeRisk = calculateFeatureRisk(cvFlightTime,        NORMAL_RANGES.cvFlightTime, DYSLEXIC_RANGES.cvFlightTime);
  const backspaceRisk  = calculateFeatureRisk(backspaceRate, { max: NORMAL_RANGES.backspaceRate.max },  { threshold: DYSLEXIC_RANGES.backspaceRate.min });
  const pauseRisk      = calculateFeatureRisk(pauseFrequency,      { max: NORMAL_RANGES.pauseFrequency.p95 }, { threshold: DYSLEXIC_RANGES.pauseFrequency.min });
  const speedRisk      = calculateLowerIsWorseRisk(wpm, DYSLEXIC_RANGES.wpm.max, DYSLEXIC_RANGES.wpm.threshold);
  const errorRateRisk  = calculateErrorRateRisk(errorRate);

  const ruleBasedScore =
    FEATURE_WEIGHTS.holdTimeVariability   * holdTimeRisk   +
    FEATURE_WEIGHTS.flightTimeVariability * flightTimeRisk +
    FEATURE_WEIGHTS.backspaceRate         * backspaceRisk  +
    FEATURE_WEIGHTS.pauseFrequency        * pauseRisk      +
    FEATURE_WEIGHTS.overallSpeed          * speedRisk      +
    FEATURE_WEIGHTS.errorRate             * errorRateRisk;

  let finalScore = ruleBasedScore;
  if (mlScore !== null && typeof mlScore === 'number') {
    const mlContribution = normalizeMlScore(mlScore);
    finalScore = 0.6 * ruleBasedScore + 0.4 * mlContribution;
  }

  return {
    riskScore: Math.round(finalScore),
    riskLevel: finalScore < 40 ? 'LOW' : finalScore < 70 ? 'MODERATE' : 'HIGH',
    breakdown: {
      holdTimeRisk:   Math.round(holdTimeRisk),
      flightTimeRisk: Math.round(flightTimeRisk),
      backspaceRisk:  Math.round(backspaceRisk),
      pauseRisk:      Math.round(pauseRisk),
      speedRisk:      Math.round(speedRisk),
      errorRateRisk:  Math.round(errorRateRisk),
    },
    components: {
      ruleBasedScore: Math.round(ruleBasedScore),
      mlScore:        mlScore !== null ? Math.round(normalizeMlScore(mlScore)) : null,
    },
  };
}

// =============================================================
// EXPORTS
// =============================================================
module.exports = {
  FEATURE_WEIGHTS,
  NORMAL_RANGES,
  DYSLEXIC_RANGES,
  METADATA,
  TEST_PROMPTS,
  calculateFeatureRisk,
  normalizeMlScore,
  calculateCombinedRiskScore,
};
