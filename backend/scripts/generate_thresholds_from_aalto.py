"""
Generate keystrokeConfig.js from Aalto Dataset Statistics
===========================================================

Takes processed Aalto training data and generates a JavaScript config
with thresholds derived from real sentence-typing data.

Usage:
    python generate_thresholds_from_aalto.py --input training_data_aalto.json --output ../config/keystrokeConfig_Aalto.js
"""

import json
import os
import numpy as np
import argparse
from datetime import datetime


def calculate_percentiles(values):
    """Calculate key percentiles for threshold setting."""
    return {
        'p5':   float(np.percentile(values, 5)),
        'p25':  float(np.percentile(values, 25)),
        'p50':  float(np.percentile(values, 50)),
        'p75':  float(np.percentile(values, 75)),
        'p95':  float(np.percentile(values, 95)),
        'mean': float(np.mean(values)),
        'std':  float(np.std(values)),
    }


def generate_config(input_path, output_path):
    """Generate JavaScript config from Aalto data."""

    with open(input_path, encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} sessions from Aalto dataset")

    # ----------------------------------------------------------------
    # Collect feature arrays (with per-feature sanity bounds)
    # ----------------------------------------------------------------
    features = {
        'avgHoldTime':    [s['avgHoldTime']    for s in data if 0    < s.get('avgHoldTime', 0)     < 2000],
        'cvHoldTime':     [s['cvHoldTime']     for s in data if 0    < s.get('cvHoldTime', 0)      < 200],
        'avgFlightTime':  [s['avgFlightTime']  for s in data if -500 < s.get('avgFlightTime', 0)   < 5000],
        'cvFlightTime':   [s['cvFlightTime']   for s in data if 0    < s.get('cvFlightTime', 0)    < 1000],
        'wpm':            [s['wpm']            for s in data if 0    < s.get('wpm', 0)             < 300],
        'pauseFrequency': [s['pauseFrequency'] for s in data if 0   <= s.get('pauseFrequency', -1) <= 10],
        'pauseDuration':  [s['pauseDuration']  for s in data if 0   <= s.get('pauseDuration', -1)  < 60000],
        'backspaceRate':  [s['backspaceRate']  for s in data if 0   <= s.get('backspaceRate', -1)  <= 1],
    }

    stats = {key: calculate_percentiles(vals) for key, vals in features.items()}

    # ----------------------------------------------------------------
    # Print extraction summary
    # ----------------------------------------------------------------
    print(f"\n{'='*60}")
    print(f"THRESHOLD STATISTICS  ({len(data)} sessions)")
    print(f"{'='*60}")
    for feat, s in stats.items():
        print(f"  {feat:20s}  mean={s['mean']:.3f}  p5={s['p5']:.3f}  p95={s['p95']:.3f}")

    # ----------------------------------------------------------------
    # Build JavaScript config string
    # ----------------------------------------------------------------
    timestamp = datetime.now().strftime('%B %Y')
    n = len(data)

    # Prefer ML calibration saved by trainModel.py (p5/p95 of score_samples).
    calib_min = -0.60
    calib_max = 0.20
    calib_source = 'fallback-default'
    meta_path = os.path.normpath(
      os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'ml', 'keystroke', 'model_features.json')
    )
    if os.path.exists(meta_path):
      try:
        with open(meta_path, 'r', encoding='utf-8') as mf:
          meta = json.load(mf)
        cal = meta.get('mlScoreCalibration', {})
        if 'minScore' in cal and 'maxScore' in cal:
          calib_min = float(cal['minScore'])
          calib_max = float(cal['maxScore'])
          calib_source = cal.get('method', 'percentile')
      except (OSError, ValueError, TypeError):
        pass

    js_config = f"""/**
 * KEYSTROKE SCORING CONFIGURATION
 * Derived from Aalto 136M Keystrokes Dataset (SENTENCE TYPING)
 *
 * METHODOLOGY:
 *   1. Normal ranges  : empirically derived from Aalto Dataset (n={n} sessions)
 *   2. Risk thresholds: statistical outlier detection (95th / 5th percentile)
 *   3. Feature weights: based on discriminative power in typing-disorder research
 *
 * DATA SOURCE  : Aalto University 136M Keystrokes Dataset (Dhakal et al., 2018)
 * TASK         : Sentence transcription (NOT password typing)
 * ANALYSIS DATE: {timestamp}
 *
 * CITATION:
 *   Dhakal, V., Feit, A., Kristensson, P. O., & Oulasvirta, A. (2018).
 *   Observations on Typing from 136 Million Keystrokes.
 *   CHI 2018 (Best Paper Award). https://doi.org/10.1145/3173574.3174220
 */

// =============================================================
// FEATURE WEIGHTS (relative importance in dyslexia detection)
// =============================================================
const FEATURE_WEIGHTS = {{
  holdTimeVariability:   0.294,
  flightTimeVariability: 0.235,
  backspaceRate:         0.235,
  pauseFrequency:        0.118,
  overallSpeed:          0.118,
}};

// =============================================================
// NORMAL RANGES  (Aalto sentence-typing population)
// =============================================================
const NORMAL_RANGES = {{
  avgHoldTime: {{
    mean: {stats['avgHoldTime']['mean']:.2f},
    std:  {stats['avgHoldTime']['std']:.2f},
    min:  {stats['avgHoldTime']['p5']:.2f},
    max:  {stats['avgHoldTime']['p95']:.2f},
    unit: 'ms',
  }},

  cvHoldTime: {{
    mean:      {stats['cvHoldTime']['mean']:.2f},
    max:       {stats['cvHoldTime']['p95']:.2f},
    threshold: {stats['cvHoldTime']['p75']:.2f},
    unit:      '%',
  }},

  avgFlightTime: {{
    mean: {stats['avgFlightTime']['mean']:.2f},
    std:  {stats['avgFlightTime']['std']:.2f},
    min:  {stats['avgFlightTime']['p5']:.2f},
    max:  {stats['avgFlightTime']['p95']:.2f},
    unit: 'ms',
  }},

  cvFlightTime: {{
    mean:      {stats['cvFlightTime']['mean']:.2f},
    max:       {stats['cvFlightTime']['p95']:.2f},
    threshold: {stats['cvFlightTime']['p75']:.2f},
    unit:      '%',
  }},

  wpm: {{
    mean: {stats['wpm']['mean']:.2f},
    std:  {stats['wpm']['std']:.2f},
    min:  {stats['wpm']['p5']:.2f},
    max:  {stats['wpm']['p95']:.2f},
    unit: 'words/min',
  }},

  pauseFrequency: {{
    mean: {stats['pauseFrequency']['mean']:.4f},
    p95:  {stats['pauseFrequency']['p95']:.4f},
    unit: 'pauses/word',
    note: 'Normalized: pauses(>2 s) per word typed',
  }},

  pauseDuration: {{
    mean: {stats['pauseDuration']['mean']:.2f},
    p95:  {stats['pauseDuration']['p95']:.2f},
    unit: 'ms',
    note: 'Average duration of pauses >2 s',
  }},

  backspaceRate: {{
    mean:      {stats['backspaceRate']['mean']:.4f},
    max:       {stats['backspaceRate']['p95']:.4f},
    excellent: {stats['backspaceRate']['p25']:.4f},
    unit:      'ratio',
    source:    'Aalto 136M Keystrokes (BKSP/DEL keypresses)',
  }},
}};

// =============================================================
// DYSLEXIC RANGES  (statistical outlier thresholds)
// =============================================================
const DYSLEXIC_RANGES = {{
  avgHoldTime: {{
    min:           {stats['avgHoldTime']['p95']:.2f},
    threshold:     {stats['avgHoldTime']['mean'] + 2 * stats['avgHoldTime']['std']:.2f},
    unit:          'ms',
    justification: 'Beyond 95th percentile of normal sentence typing',
  }},

  cvHoldTime: {{
    min:           {stats['cvHoldTime']['p95']:.2f},
    threshold:     {stats['cvHoldTime']['mean'] + 2 * stats['cvHoldTime']['std']:.2f},
    unit:          '%',
    justification: 'Severe motor inconsistency',
  }},

  avgFlightTime: {{
    min:           {stats['avgFlightTime']['p95']:.2f},
    threshold:     {stats['avgFlightTime']['mean'] + 2 * stats['avgFlightTime']['std']:.2f},
    unit:          'ms',
    justification: 'Processing delays beyond normal range',
  }},

  cvFlightTime: {{
    min:           {stats['cvFlightTime']['p95']:.2f},
    threshold:     {stats['cvFlightTime']['mean'] + 2 * stats['cvFlightTime']['std']:.2f},
    unit:          '%',
    justification: 'Extreme rhythm variability',
  }},

  wpm: {{
    max:           {stats['wpm']['p25']:.2f},
    threshold:     {stats['wpm']['p5']:.2f},
    unit:          'words/min',
    justification: 'Speed below 25th percentile signals processing difficulty',
  }},

  pauseFrequency: {{
    min:           {stats['pauseFrequency']['p95']:.4f},
    threshold:     {max(stats['pauseFrequency']['p95'], stats['pauseFrequency']['mean'] + 2 * stats['pauseFrequency']['std']):.4f},
    unit:          'pauses/word',
    justification: 'Excessive hesitation (per-word, sentence-length neutral)',
  }},

  pauseDuration: {{
    min:           {stats['pauseDuration']['p95']:.2f},
    threshold:     {max(stats['pauseDuration']['p95'], stats['pauseDuration']['mean'] + 2 * stats['pauseDuration']['std']):.2f},
    unit:          'ms',
    justification: 'Long pauses indicate high cognitive load',
  }},

  backspaceRate: {{
    min:           {stats['backspaceRate']['p95']:.4f},
    threshold:     {max(stats['backspaceRate']['p95'], stats['backspaceRate']['mean'] + 2 * stats['backspaceRate']['std']):.4f},
    unit:          'ratio',
    justification: 'Frequent BKSP/DEL use beyond 95th percentile',
  }},
}};

// =============================================================
// METADATA
// =============================================================
const METADATA = {{
  dataSource:   'Aalto 136M Keystrokes Dataset (sentence typing)',
  subjects:     168000,
  sessions:     {n},
  analysisDate: '{timestamp}',
  version:      '4.0-aalto-derived',
  mlScoreCalibration: {{
    minScore: {calib_min:.6f},
    maxScore: {calib_max:.6f},
    source: '{calib_source}',
  }},

  primaryCitations: [
    'Dhakal et al. (2018) - Observations on Typing from 136M Keystrokes (CHI Best Paper)',
    'Chandola et al. (2009) - Anomaly Detection: A Survey',
  ],

  advantages: [
    'Real sentence typing data (not passwords)',
    'Large sample size ({n} sessions)',
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
}};

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
function calculateFeatureRisk(value, normalRange, dyslexicRange) {{
  const normMax = normalRange.max  ?? Infinity;
  const normMin = normalRange.min  ?? -Infinity;
  const dyslMin = dyslexicRange?.min       ?? normMax;
  const dyslThr = dyslexicRange?.threshold ?? dyslMin;

  if (value >= normMin && value <= normMax) return 0;
  if (value >= dyslThr) return 100;

  const range = dyslThr - normMax;
  if (range <= 0) return value > normMax ? 100 : 0;
  return Math.min(100, Math.max(0, ((value - normMax) / range) * 100));
}}

/**
 * Risk for features where lower values are worse (e.g., WPM).
 */
function calculateLowerIsWorseRisk(value, normalMin, dyslexicThreshold) {{
  if (value >= normalMin) return 0;
  if (value <= dyslexicThreshold) return 100;

  const span = normalMin - dyslexicThreshold;
  if (span <= 0) return value < normalMin ? 100 : 0;
  return Math.min(100, Math.max(0, ((normalMin - value) / span) * 100));
}}

/**
 * Percentile-based normalization of Isolation Forest score to 0-100 risk.
 * lower score => more anomalous => higher risk.
 */
function normalizeMlScore(mlScore, calibration = METADATA.mlScoreCalibration || {{}}) {{
  const minScore = Number(calibration.minScore);
  const maxScore = Number(calibration.maxScore);

  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore) || maxScore <= minScore) {{
    return 0;
  }}

  const normalized = ((maxScore - mlScore) / (maxScore - minScore)) * 100;
  return Math.max(0, Math.min(100, normalized));
}}

/**
 * Combine rule-based feature risks with optional ML anomaly score.
 * Fusion: 60% rule-based + 40% ML  (Aalto revision, March 2026).
 */
function calculateCombinedRiskScore(metrics, mlScore = null) {{
  const {{ cvHoldTime, cvFlightTime, backspaceRate, pauseFrequency, wpm }} = metrics;

  const holdTimeRisk   = calculateFeatureRisk(cvHoldTime,          NORMAL_RANGES.cvHoldTime,   DYSLEXIC_RANGES.cvHoldTime);
  const flightTimeRisk = calculateFeatureRisk(cvFlightTime,        NORMAL_RANGES.cvFlightTime, DYSLEXIC_RANGES.cvFlightTime);
  const backspaceRisk  = calculateFeatureRisk(backspaceRate, {{ max: NORMAL_RANGES.backspaceRate.max }},  {{ threshold: DYSLEXIC_RANGES.backspaceRate.min }});
  const pauseRisk      = calculateFeatureRisk(pauseFrequency,      {{ max: NORMAL_RANGES.pauseFrequency.p95 }}, {{ threshold: DYSLEXIC_RANGES.pauseFrequency.min }});
  const speedRisk      = calculateLowerIsWorseRisk(wpm, DYSLEXIC_RANGES.wpm.max, DYSLEXIC_RANGES.wpm.threshold);

  const ruleBasedScore =
    FEATURE_WEIGHTS.holdTimeVariability   * holdTimeRisk   +
    FEATURE_WEIGHTS.flightTimeVariability * flightTimeRisk +
    FEATURE_WEIGHTS.backspaceRate         * backspaceRisk  +
    FEATURE_WEIGHTS.pauseFrequency        * pauseRisk      +
    FEATURE_WEIGHTS.overallSpeed          * speedRisk;

  let finalScore = ruleBasedScore;
  if (mlScore !== null && typeof mlScore === 'number') {{
    const mlContribution = normalizeMlScore(mlScore);
    finalScore = 0.6 * ruleBasedScore + 0.4 * mlContribution;
  }}

  return {{
    riskScore: Math.round(finalScore),
    riskLevel: finalScore < 40 ? 'LOW' : finalScore < 70 ? 'MODERATE' : 'HIGH',
    breakdown: {{
      holdTimeRisk:   Math.round(holdTimeRisk),
      flightTimeRisk: Math.round(flightTimeRisk),
      backspaceRisk:  Math.round(backspaceRisk),
      pauseRisk:      Math.round(pauseRisk),
      speedRisk:      Math.round(speedRisk),
    }},
    components: {{
      ruleBasedScore: Math.round(ruleBasedScore),
      mlScore:        mlScore !== null ? Math.round(normalizeMlScore(mlScore)) : null,
    }},
  }};
}}

// =============================================================
// EXPORTS
// =============================================================
module.exports = {{
  FEATURE_WEIGHTS,
  NORMAL_RANGES,
  DYSLEXIC_RANGES,
  METADATA,
  TEST_PROMPTS,
  calculateFeatureRisk,
  normalizeMlScore,
  calculateCombinedRiskScore,
}};
"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_config)

    print(f"\n✅ Config written to {output_path}")
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("  1. python ../src/ml/keystroke/trainModel.py")
    print("  2. Copy keystrokeConfig_Aalto.js -> backend/config/keystrokeConfig.js")
    print("  3. Run end-to-end test")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate keystrokeConfig.js from Aalto data')
    parser.add_argument('--input',  required=True,                    help='Processed Aalto JSON (training_data_aalto.json)')
    parser.add_argument('--output', default='keystrokeConfig_Aalto.js', help='Output JS config path')
    args = parser.parse_args()
    generate_config(args.input, args.output)
